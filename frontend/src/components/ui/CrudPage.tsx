
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import {
  Plus,
  RefreshCw,
  Search,
  Eye,
  Edit3,
  RotateCcw,
  CheckCircle,
  Wrench,
  UserPlus,
  ClipboardCheck,
} from 'lucide-react';

import { api } from '@/lib/api';
import { can } from '@/lib/permissions';

import Page from './Page';
import Table from './Table';
import Badge from './Badge';

const valueAt = (obj: any, path: string) =>
  path.split('.').reduce((v, k) => v?.[k], obj);

const rowId = (row: any) =>
  row?.id ||
  row?.user_id ||
  row?.userId ||
  row?.assignment_id ||
  row?.dispatch_id ||
  row?.request_id ||
  row?.maintenance_id ||
  row?.asset_id ||
  row?.branch_id ||
  row?.asset_type_id;

const display = (v: any) => {
  if (v === null || v === undefined || v === '') {
    return '—';
  }

  if (typeof v === 'object') {
    return (
      v.name ||
      v.full_name ||
      v.type_name ||
      v.branch_name ||
      v.role_name ||
      v.email ||
      JSON.stringify(v)
    );
  }

  return String(v);
};

const resourceFromEndpoint = (endpoint: string) => {
  if (endpoint === '/maintenance/requests') {
    return 'maintenance';
  }

  return endpoint.replace(/^\/+/, '').split('/')[0];
};

const supportsGenericEdit = (resource: string) => {
  return [
    'users',
    'branches',
    'asset-types',
    'assets',
  ].includes(resource);
};

export default function CrudPage({
  title,
  description,
  endpoint,
  columns,
  createHref,
  searchPlaceholder = 'Search...',
  filters,
}: any) {
  const resource = resourceFromEndpoint(endpoint);

  const canView = can(resource, 'view');
  const canCreate = can(resource, 'create');
  const canUpdate = can(resource, 'update');

  const canReturn = can(resource, 'return');
  const canReceive = can(resource, 'receive');
  const canStatus = can(resource, 'status');
  const canAssign = can(resource, 'assign');
  const canRecord = can(resource, 'record');

  const showGenericEdit =
    supportsGenericEdit(resource) && canUpdate;

  const [rows, setRows] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.get(endpoint, {
        params: {
          ...(q ? { search: q } : {}),
          ...(filters || {}),
        },
      });

      const data = response.data;

      setRows(
        Array.isArray(data)
          ? data
          : data?.data ||
            data?.items ||
            []
      );
    } catch (e: any) {
      setError(
        e.response?.data?.message ||
          'Unable to load data. Check that the backend is running.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canView) {
      load();
    } else {
      setLoading(false);
      setError(
        'You do not have permission to view this resource.'
      );
    }
  }, []);

  const renderWorkflowActions = (
    id: string | number
  ) => {
    const actions: React.ReactNode[] = [];

    /*
     * ASSIGNMENT RETURN
     *
     * PATCH /assignments/:id/return
     */
    if (
      resource === 'assignments' &&
      canReturn
    ) {
      actions.push(
        <Link
          key="return"
          className="btn btn-secondary"
          href={`/assignments/${id}/return`}
          title="Return assignment"
        >
          <RotateCcw size={14} />
        </Link>
      );
    }

    /*
     * DISPATCH RECEIVE
     *
     * PATCH /dispatches/:id/receive
     */
    if (
      resource === 'dispatches' &&
      canReceive
    ) {
      actions.push(
        <Link
          key="receive"
          className="btn btn-secondary"
          href={`/dispatches/${id}/receive`}
          title="Receive dispatch"
        >
          <CheckCircle size={14} />
        </Link>
      );
    }

    /*
     * ASSET STATUS
     *
     * PATCH /assets/:id/status
     */
    if (
      resource === 'assets' &&
      canStatus
    ) {
      actions.push(
        <Link
          key="status"
          className="btn btn-secondary"
          href={`/assets/${id}/status`}
          title="Update asset status"
        >
          <ClipboardCheck size={14} />
        </Link>
      );
    }

    /*
     * MAINTENANCE STATUS
     *
     * PATCH /maintenance/requests/:id/status
     */
    if (
      resource === 'maintenance' &&
      canStatus
    ) {
      actions.push(
        <Link
          key="maintenance-status"
          className="btn btn-secondary"
          href={`/maintenance/requests/${id}/status`}
          title="Update maintenance status"
        >
          <Wrench size={14} />
        </Link>
      );
    }

    /*
     * MAINTENANCE ASSIGN
     *
     * POST /maintenance/requests/:id/assign
     */
    if (
      resource === 'maintenance' &&
      canAssign
    ) {
      actions.push(
        <Link
          key="assign"
          className="btn btn-secondary"
          href={`/maintenance/requests/${id}/assign`}
          title="Assign technician"
        >
          <UserPlus size={14} />
        </Link>
      );
    }

    /*
     * MAINTENANCE RECORD
     *
     * POST /maintenance/requests/:id/records
     */
    if (
      resource === 'maintenance' &&
      canRecord
    ) {
      actions.push(
        <Link
          key="record"
          className="btn btn-secondary"
          href={`/maintenance/requests/${id}/records/create`}
          title="Add maintenance record"
        >
          <ClipboardCheck size={14} />
        </Link>
      );
    }

    return actions;
  };

  return (
    <Page
      title={title}
      description={description}
      action={
        createHref &&
        canCreate ? (
          <Link
            className="btn btn-primary"
            href={createHref}
          >
            <Plus size={16} />
            Add New
          </Link>
        ) : null
      }
    >
      <div className="toolbar">
        <div
          style={{
            maxWidth: 420,
            flex: 1,
            position: 'relative',
          }}
        >
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: 12,
              top: 12,
              color: '#98a2b3',
            }}
          />

          <input
            className="input"
            style={{
              paddingLeft: 36,
            }}
            value={q}
            onChange={(e) =>
              setQ(e.target.value)
            }
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                load();
              }
            }}
            placeholder={searchPlaceholder}
          />
        </div>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={load}
        >
          <RefreshCw size={15} />
          Refresh
        </button>
      </div>

      {error && (
        <div
          className="alert"
          style={{
            marginBottom: 16,
          }}
        >
          {error}
        </div>
      )}

      <Table
        headers={[
          ...columns.map(
            (column: any) => column.label
          ),
          'Actions',
        ]}
      >
        {loading ? (
          <tr>
            <td
              colSpan={columns.length + 1}
            >
              Loading...
            </td>
          </tr>
        ) : rows.length === 0 ? (
          <tr>
            <td
              colSpan={columns.length + 1}
            >
              <div className="empty">
                No records found.
              </div>
            </td>
          </tr>
        ) : (
          rows.map(
            (row: any, index: number) => {
              const id =
                rowId(row) || index;

              return (
                <tr key={id}>
                  {columns.map(
                    (column: any) => (
                      <td key={column.key}>
                        {column.badge ? (
                          <Badge
                            value={valueAt(
                              row,
                              column.key
                            )}
                          />
                        ) : column.render ? (
                          column.render(row)
                        ) : (
                          display(
                            valueAt(
                              row,
                              column.key
                            )
                          )
                        )}
                      </td>
                    )
                  )}

                  <td>
                    <div className="actions">
                      {canView && (
                        <Link
                          className="btn btn-secondary"
                          href={`${endpoint}/${id}`}
                          title="View"
                        >
                          <Eye size={14} />
                        </Link>
                      )}

                      {showGenericEdit && (
                        <Link
                          className="btn btn-secondary"
                          href={`${endpoint}/${id}/edit`}
                          title="Edit"
                        >
                          <Edit3 size={14} />
                        </Link>
                      )}

                      {renderWorkflowActions(id)}
                    </div>
                  </td>
                </tr>
              );
            }
          )
        )}
      </Table>
    </Page>
  );
}

