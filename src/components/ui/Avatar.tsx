// ============================================
// 6. AVATAR COMPONENT (src/components/ui/Avatar.tsx)
// ============================================
import React, { forwardRef } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string
  alt?: string
  fallback?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, alt, fallback, size = 'md', ...props }, ref) => {
    // Classes par taille
    const sizeClasses: Record<NonNullable<AvatarProps['size']>, string> = {
      sm: 'h-8 w-8 text-xs',
      md: 'h-10 w-10 text-sm', 
      lg: 'h-12 w-12 text-base',
      xl: 'h-16 w-16 text-lg'
    }

    // Initiales du fallback
    const initials: string =
      fallback ||
      (alt
        ?.split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()) ||
      '??'

    return (
      <div
        ref={ref}
        className={cn(
          "relative flex shrink-0 overflow-hidden rounded-full bg-primary-100",
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {src ? (
          <div className="relative h-full w-full">
            <Image
              src={src}
              alt={alt || 'Avatar'}
              fill
              style={{ objectFit: 'cover' }}
            />
          </div>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-primary-500 text-white font-medium">
            {initials}
          </div>
        )}
      </div>
    )
  }
)

Avatar.displayName = "Avatar"

export { Avatar }
