import type { ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: ReactNode;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  title?: string;
}

const variantClasses = {
  primary: 'bg-primary text-primary-foreground border-primary hover:bg-primary/90 shadow-sm hover:shadow-md',
  secondary: 'bg-secondary text-secondary-foreground border-border hover:bg-secondary/90',
  success: 'bg-green-600 text-white border-green-600 hover:bg-green-700 shadow-sm hover:shadow-md',
  warning: 'bg-amber-500 text-white border-amber-500 hover:bg-amber-600 shadow-sm hover:shadow-md',
  danger: 'bg-red-600 text-white border-red-600 hover:bg-red-700 shadow-sm hover:shadow-md',
  ghost: 'bg-transparent text-foreground border-transparent hover:bg-accent hover:border-border'
};

const sizeClasses = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base'
};

export function Button({ 
  children, 
  onClick, 
  disabled = false, 
  loading = false, 
  variant = 'primary', 
  size = 'md',
  icon,
  className = '',
  type = 'button',
  title
}: ButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center gap-2 font-medium border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const combinedClasses = `
    ${baseClasses}
    ${variantClasses[variant]}
    ${sizeClasses[size]}
    ${disabled || loading ? 'opacity-50 cursor-not-allowed' : ''}
    ${className}
  `.trim();

  return (
    <button
      type={type}
      className={combinedClasses}
      onClick={onClick}
      disabled={disabled || loading}
      title={title}
    >
      {loading ? (
        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : icon}
      {children}
    </button>
  );
}

// Componentes de ações específicas para deixar as intenções mais claras
export function SaveButton({ onClick, loading = false, disabled = false }: { onClick?: () => void; loading?: boolean; disabled?: boolean }) {
  return (
    <Button
      variant="primary"
      onClick={onClick}
      loading={loading}
      disabled={disabled}
      icon={!loading && (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
        </svg>
      )}
      title="Salvar alterações"
    >
      {loading ? 'Salvando...' : 'Salvar'}
    </Button>
  );
}

export function CancelButton({ onClick }: { onClick?: () => void }) {
  return (
    <Button
      variant="secondary"
      onClick={onClick}
      icon={
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      }
      title="Cancelar ação"
    >
      Cancelar
    </Button>
  );
}

export function DeleteButton({ onClick, loading = false, disabled = false }: { onClick?: () => void; loading?: boolean; disabled?: boolean }) {
  return (
    <Button
      variant="danger"
      onClick={onClick}
      loading={loading}
      disabled={disabled}
      icon={!loading && (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      )}
      title="Excluir permanentemente"
    >
      {loading ? 'Excluindo...' : 'Excluir'}
    </Button>
  );
}

export function SendButton({ onClick, loading = false, disabled = false, children = 'Enviar' }: { onClick?: () => void; loading?: boolean; disabled?: boolean; children?: ReactNode }) {
  return (
    <Button
      variant="success"
      onClick={onClick}
      loading={loading}
      disabled={disabled}
      icon={!loading && (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
      )}
      title="Enviar"
    >
      {loading ? 'Enviando...' : children}
    </Button>
  );
}

export function EditButton({ onClick }: { onClick?: () => void }) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      icon={
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      }
      title="Editar"
    >
      Editar
    </Button>
  );
}
