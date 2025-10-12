// src/components/modules/associations/roles/ui/RoleBadge.tsx
'use client'

import React from 'react'
import { Badge } from '@/components/ui/Badge'
import { RoleWithUsage } from '@/types/association/role'
import { Shield, Crown, AlertCircle } from 'lucide-react'

// ============================================
// INTERFACES
// ============================================

interface RoleBadgeProps {
  role: RoleWithUsage
  showIcon?: boolean
  showTooltip?: boolean
  size?: 'sm' | 'md' | 'lg'
  onClick?: () => void
  className?: string
}

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

export const RoleBadge: React.FC<RoleBadgeProps> = ({
  role,
  showIcon = true,
  showTooltip = false,
  size = 'md',
  onClick,
  className = '',
}) => {
  // ============================================
  // STYLES PAR TAILLE
  // ============================================

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-2',
  }

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  }

  // ============================================
  // COULEUR DU BADGE
  // ============================================

  const badgeStyle = {
    backgroundColor: role.color || '#6B7280',
    color: getContrastColor(role.color || '#6B7280'),
    borderColor: role.color || '#6B7280',
  }

  // ============================================
  // ICÔNE SELON TYPE
  // ============================================

  const renderIcon = () => {
    if (!showIcon) return null

    if (role.isUnique) {
      return <Crown className={`${iconSizes[size]} mr-1`} />
    }

    if (role.isMandatory) {
      return <AlertCircle className={`${iconSizes[size]} mr-1`} />
    }

    return <Shield className={`${iconSizes[size]} mr-1`} />
  }

  // ============================================
  // TOOLTIP
  // ============================================

  const tooltipContent = showTooltip ? (
    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded shadow-lg z-50 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
      <div className="space-y-1">
        <p className="font-semibold">{role.name}</p>
        <p className="text-gray-300">{role.description}</p>
        <p className="text-gray-400">{role.permissions.length} permission(s)</p>
        {role.membersCount > 0 && (
          <p className="text-gray-400">{role.membersCount} membre(s)</p>
        )}
      </div>
      <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
    </div>
  ) : null

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="relative group inline-block">
      <Badge
        style={badgeStyle}
        className={`
          ${sizeClasses[size]}
          font-medium
          inline-flex items-center
          border
          rounded-full
          transition-all
          ${onClick ? 'cursor-pointer hover:opacity-80 hover:scale-105' : ''}
          ${className}
        `}
        onClick={onClick}
      >
        {renderIcon()}
        <span>{role.name}</span>
      </Badge>
      {tooltipContent}
    </div>
  )
}

// ============================================
// HELPER: Calculer couleur de contraste
// ============================================

function getContrastColor(hexColor: string): string {
  // Convertir hex en RGB
  const hex = hexColor.replace('#', '')
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)

  // Calculer luminosité
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255

  // Retourner blanc ou noir selon luminosité
  return luminance > 0.5 ? '#000000' : '#FFFFFF'
}

// ============================================
// VARIANTE: Liste de badges
// ============================================

interface RoleBadgesListProps {
  roles: RoleWithUsage[]
  size?: 'sm' | 'md' | 'lg'
  max?: number
  onRoleClick?: (role: RoleWithUsage) => void
}

export const RoleBadgesList: React.FC<RoleBadgesListProps> = ({
  roles,
  size = 'sm',
  max,
  onRoleClick,
}) => {
  const displayRoles = max ? roles.slice(0, max) : roles
  const remainingCount = max && roles.length > max ? roles.length - max : 0

  return (
    <div className="flex flex-wrap gap-1">
      {displayRoles.map(role => (
        <RoleBadge
          key={role.id}
          role={role}
          size={size}
          showIcon={true}
          showTooltip={true}
          onClick={onRoleClick ? () => onRoleClick(role) : undefined}
        />
      ))}
      {remainingCount > 0 && (
        <Badge variant="secondary" className={`${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
          +{remainingCount}
        </Badge>
      )}
    </div>
  )
}