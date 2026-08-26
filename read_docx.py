import zipfile
import xml.etree.ElementTree as ET
import sys

def extract_text_from_docx(docx_path):
    try:
        with zipfile.ZipFile(docx_path) as docx:
            xml_content = docx.read('word/document.xml')
            tree = ET.XML(xml_content)
            
            # The word namespace
            WORD_NAMESPACE = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'
            PARA = WORD_NAMESPACE + 'p'
            TEXT = WORD_NAMESPACE + 't'
            
            paragraphs = []
            for paragraph in tree.iter(PARA):
                texts = [node.text for node in paragraph.iter(TEXT) if node.text]
                if texts:
                    paragraphs.append(''.join(texts))
            
            return '\n'.join(paragraphs)
    except Exception as e:
        return f"Error reading {docx_path}: {e}"

if __name__ == "__main__":
    if len(sys.argv) > 1:
        for file in sys.argv[1:]:
            print(f"--- Content of {file} ---")
            print(extract_text_from_docx(file)[:2000]) # Print first 2000 chars for brevity, can print more if needed
            print("\n")
    else:
        print("Please provide docx files")
