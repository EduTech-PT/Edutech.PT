import React from 'react';
import ReactQuill from 'react-quill';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, placeholder, className = '' }) => {
  
  // Failsafe: Se ReactQuill não carregar corretamente (ex: SSR ou módulo quebrado), renderiza textarea
  // Verifica se ReactQuill é um objeto com default export ou o próprio construtor
  const QuillLib = ReactQuill as any;
  const QuillComponent = QuillLib?.default || QuillLib || (window as any).ReactQuill;

  if (!QuillComponent) {
      return (
          <textarea 
            className={`w-full p-3 rounded-lg border border-slate-300 ${className}`}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
          />
      )
  }

  // Configuração da Barra de Ferramentas Completa
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [{'list': 'ordered'}, {'list': 'bullet'}, {'indent': '-1'}, {'indent': '+1'}],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'align': [] }],
      ['link', 'clean']
    ],
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet', 'indent',
    'link', 'color', 'background', 'align'
  ];

  return (
    <div className={`rich-text-editor-wrapper ${className}`}>
      <QuillComponent 
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
      />
    </div>
  );
};