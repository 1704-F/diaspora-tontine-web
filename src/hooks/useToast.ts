// ============================================
// 6. HOOK PERSONNALISÉ TOAST (src/hooks/useToast.ts)
// ============================================
import { toast } from 'sonner'

interface ToastOptions {
  title?: string
  description?: string
  duration?: number
}

export function useToast() {
  return {
    success: (message: string, options?: ToastOptions) => {
      toast.success(message, {
        description: options?.description,
        duration: options?.duration,
      })
    },
    
    error: (message: string, options?: ToastOptions) => {
      toast.error(message, {
        description: options?.description,
        duration: options?.duration,
      })
    },
    
    warning: (message: string, options?: ToastOptions) => {
      toast.warning(message, {
        description: options?.description,
        duration: options?.duration,
      })
    },
    
    info: (message: string, options?: ToastOptions) => {
      toast.info(message, {
        description: options?.description,
        duration: options?.duration,
      })
    },
    
    loading: (message: string) => {
      return toast.loading(message)
    },
    
    dismiss: (toastId?: string | number) => {
      toast.dismiss(toastId)
    }
  }
}
