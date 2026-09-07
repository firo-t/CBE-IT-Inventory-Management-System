const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, 'src');

function patchController(moduleName, serviceName, methods) {
  const filePath = path.join(baseDir, moduleName, `${moduleName}.controller.ts`);
  let content = fs.readFileSync(filePath, 'utf-8');

  // Add CurrentUser import if missing
  if (!content.includes('CurrentUser')) {
    content = content.replace(/import \{ Controller.*\} from '@nestjs\/common';/, 
      `import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';\nimport { CurrentUser } from '../auth/decorators/current-user.decorator';`);
  }

  methods.forEach(m => {
    // e.g. create(@Body() createDto: CreateDto) {
    const regex = new RegExp(`${m.name}\\(([^{]+)\\)\\s*\\{`, 'g');
    content = content.replace(regex, (match, args) => {
      if (args.includes('@CurrentUser() user: any')) return match; // already patched
      return `${m.name}(${args}, @CurrentUser() user: any) {`;
    });

    // replace service call: return this.service.create(dto); -> return this.service.create(dto, user);
    const callRegex = new RegExp(`this\\.${serviceName}\\.${m.name}\\(([^)]+)\\)`, 'g');
    content = content.replace(callRegex, (match, args) => {
      if (args.includes('user')) return match;
      if (args.trim() === '') return `this.${serviceName}.${m.name}(user)`;
      return `this.${serviceName}.${m.name}(${args}, user)`;
    });
  });

  fs.writeFileSync(filePath, content);
  console.log(`Patched controller: ${moduleName}`);
}

function patchService(moduleName, serviceClass, methods, importEntity) {
  const filePath = path.join(baseDir, moduleName, `${moduleName}.service.ts`);
  let content = fs.readFileSync(filePath, 'utf-8');

  // Add AuditLogsService import
  if (!content.includes('AuditLogsService')) {
    content = `import { AuditLogsService } from '../audit-logs/audit-logs.service';\n` + content;
  }

  // Inject AuditLogsService in constructor
  if (!content.includes('private auditLogsService: AuditLogsService')) {
    content = content.replace(/constructor\(([^)]+)\) \{/, 'constructor($1, private auditLogsService: AuditLogsService) {');
  }

  methods.forEach(m => {
    // Add user parameter to method definition
    const regex = new RegExp(`async ${m.name}\\(([^)]*)\\)\\s*\\{`, 'g');
    content = content.replace(regex, (match, args) => {
      if (args.includes('user: any')) return match;
      if (args.trim() === '') return `async ${m.name}(user: any) {`;
      return `async ${m.name}(${args}, user: any) {`;
    });
  });

  fs.writeFileSync(filePath, content);
  console.log(`Patched service: ${moduleName}`);
}

// 1. Users
patchController('users', 'usersService', [
  { name: 'create' }, { name: 'update' }, { name: 'changePassword' }, { name: 'updateStatus' }
]);
patchService('users', 'UsersService', [
  { name: 'create' }, { name: 'update' }, { name: 'changePassword' }, { name: 'updateStatus' }
], 'user');

// 2. Branches
patchController('branches', 'branchesService', [
  { name: 'create' }, { name: 'update' }
]);
patchService('branches', 'BranchesService', [
  { name: 'create' }, { name: 'update' }
], 'branch');

// 3. Asset Types
patchController('asset-types', 'assetTypesService', [
  { name: 'create' }, { name: 'update' }
]);
patchService('asset-types', 'AssetTypesService', [
  { name: 'create' }, { name: 'update' }
], 'assetType');

// 4. Assets
patchController('assets', 'assetsService', [
  { name: 'create' }, { name: 'update' }
]);
patchService('assets', 'AssetsService', [
  { name: 'create' }, { name: 'update' }
], 'asset');

// 5. Assignments (create already has user)
patchController('assignments', 'assignmentsService', [
  { name: 'returnAsset' }
]);
patchService('assignments', 'AssignmentsService', [
  { name: 'create' }, { name: 'returnAsset' }
]);

// 6. Dispatches
patchController('dispatches', 'dispatchesService', [
  { name: 'create' }
]);
patchService('dispatches', 'DispatchesService', [
  { name: 'create' }
]);

