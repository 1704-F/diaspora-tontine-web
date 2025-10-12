// src/components/modules/associations/roles/ui/PermissionsSelector.tsx
'use client'

import React, { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Permission } from '@/types/association/role'
import {
  Lock,
  Search,
  CheckSquare,
  Square,
  ChevronDown,
  ChevronRight,
  AlertCircle,
} from 'lucide-react'

// ============================================
// INTERFACES
// ============================================

interface PermissionsSelectorProps {
  permissions: Permission[]
  selectedPermissions: string[]
  onChange: (permissions: string[]) => void
  groupedByCategory?: boolean
  searchable?: boolean
  showSelectAll?: boolean
  disabled?: boolean
  error?: string
  className?: string
}

interface GroupedPermissions {
  [category: string]: Permission[]
}

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

export const PermissionsSelector: React.FC<PermissionsSelectorProps> = ({
  permissions,
  selectedPermissions,
  onChange,
  groupedByCategory = true,
  searchable = true,
  showSelectAll = true,
  disabled = false,
  error,
  className = '',
}) => {
  const t = useTranslations('roles')

  const [searchQuery, setSearchQuery] = useState('')
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['finances', 'membres', 'administration'])
  )

  // ============================================
  // GROUPER PAR CATÉGORIE
  // ============================================

  const groupedPermissions: GroupedPermissions = useMemo(() => {
    const grouped: GroupedPermissions = {
      finances: [],
      membres: [],
      administration: [],
      documents: [],
      evenements: [],
    }

    permissions.forEach(permission => {
      const category = permission.category || 'autres'
      if (!grouped[category]) {
        grouped[category] = []
      }
      grouped[category].push(permission)
    })

    return grouped
  }, [permissions])

  // ============================================
  // FILTRER PAR RECHERCHE
  // ============================================

  const filteredPermissions = useMemo(() => {
    if (!searchQuery.trim()) return permissions

    const query = searchQuery.toLowerCase()
    return permissions.filter(
      p =>
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        p.id.toLowerCase().includes(query)
    )
  }, [permissions, searchQuery])

  // ============================================
  // HANDLERS
  // ============================================

  const handleToggle = (permissionId: string) => {
    if (disabled) return

    const newSelected = selectedPermissions.includes(permissionId)
      ? selectedPermissions.filter(id => id !== permissionId)
      : [...selectedPermissions, permissionId]

    onChange(newSelected)
  }

  const handleSelectAll = () => {
    if (disabled) return
    onChange(permissions.map(p => p.id))
  }

  const handleDeselectAll = () => {
    if (disabled) return
    onChange([])
  }

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(category)) {
      newExpanded.delete(category)
    } else {
      newExpanded.add(category)
    }
    setExpandedCategories(newExpanded)
  }

  const selectAllInCategory = (category: string) => {
    if (disabled) return
    const categoryPermissions = groupedPermissions[category].map(p => p.id)
    const newSelected = new Set([...selectedPermissions, ...categoryPermissions])
    onChange(Array.from(newSelected))
  }

  const deselectAllInCategory = (category: string) => {
    if (disabled) return
    const categoryPermissionIds = groupedPermissions[category].map(p => p.id)
    const newSelected = selectedPermissions.filter(id => !categoryPermissionIds.includes(id))
    onChange(newSelected)
  }

  // ============================================
  // STATS PAR CATÉGORIE
  // ============================================

  const getCategoryStats = (category: string) => {
    const categoryPerms = groupedPermissions[category]
    const selected = categoryPerms.filter(p => selectedPermissions.includes(p.id)).length
    return { total: categoryPerms.length, selected }
  }

  // ============================================
  // RENDER PERMISSION ITEM
  // ============================================

  const renderPermissionItem = (permission: Permission) => {
    const isSelected = selectedPermissions.includes(permission.id)

    return (
      <label
        key={permission.id}
        className={`
          flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all
          ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => handleToggle(permission.id)}
          disabled={disabled}
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <Lock className={`h-4 w-4 flex-shrink-0 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`} />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 text-sm">{permission.name}</p>
          <p className="text-xs text-gray-600 mt-0.5">{permission.description}</p>
        </div>
        {isSelected && (
          <CheckSquare className="h-5 w-5 text-blue-600 flex-shrink-0" />
        )}
      </label>
    )
  }

  // ============================================
  // RENDER CATÉGORIE
  // ============================================

  const renderCategory = (category: string, perms: Permission[]) => {
    if (perms.length === 0) return null

    const isExpanded = expandedCategories.has(category)
    const stats = getCategoryStats(category)
    const allSelected = stats.selected === stats.total
    const someSelected = stats.selected > 0 && stats.selected < stats.total

    return (
      <div key={category} className="border border-gray-200 rounded-lg">
        {/* Header catégorie */}
        <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200">
          <button
            type="button"
            onClick={() => toggleCategory(category)}
            className="flex items-center gap-2 flex-1 text-left"
            disabled={disabled}
          >
            {isExpanded ? (
              <ChevronDown className="h-5 w-5 text-gray-600" />
            ) : (
              <ChevronRight className="h-5 w-5 text-gray-600" />
            )}
            <h3 className="font-semibold text-gray-900 capitalize">
              {t(`categories.${category}`)}
            </h3>
            <Badge variant="secondary" className="text-xs">
              {stats.selected}/{stats.total}
            </Badge>
          </button>

          {isExpanded && (
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => selectAllInCategory(category)}
                disabled={disabled || allSelected}
                className="text-xs"
              >
                Tout
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => deselectAllInCategory(category)}
                disabled={disabled || stats.selected === 0}
                className="text-xs"
              >
                Aucun
              </Button>
            </div>
          )}
        </div>

        {/* Liste permissions */}
        {isExpanded && (
          <div className="p-4 space-y-2">
            {perms.map(renderPermissionItem)}
          </div>
        )}
      </div>
    )
  }

  // ============================================
  // RENDER PRINCIPAL
  // ============================================

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header avec recherche et actions */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <Lock className="h-4 w-4" />
          <span className="font-medium">
            {selectedPermissions.length}/{permissions.length} sélectionnée(s)
          </span>
        </div>

        {showSelectAll && (
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleSelectAll}
              disabled={disabled || selectedPermissions.length === permissions.length}
            >
              {t('form.select_all')}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleDeselectAll}
              disabled={disabled || selectedPermissions.length === 0}
            >
              {t('form.deselect_all')}
            </Button>
          </div>
        )}
      </div>

      {/* Recherche */}
      {searchable && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Rechercher une permission..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={disabled}
            className="pl-10"
          />
        </div>
      )}

      {/* Erreur */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {error}
          </p>
        </div>
      )}

      {/* Liste des permissions */}
      <div className="space-y-3 max-h-[500px] overflow-y-auto">
        {groupedByCategory ? (
          // Par catégorie
          Object.entries(groupedPermissions).map(([category, perms]) =>
            renderCategory(category, searchQuery ? perms.filter(p => filteredPermissions.includes(p)) : perms)
          )
        ) : (
          // Liste plate
          <div className="space-y-2">
            {filteredPermissions.map(renderPermissionItem)}
          </div>
        )}
      </div>

      {/* Aucun résultat */}
      {filteredPermissions.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Lock className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p>Aucune permission trouvée</p>
          {searchQuery && (
            <p className="text-sm mt-2">
              Essayez avec d'autres mots-clés
            </p>
          )}
        </div>
      )}
    </div>
  )
}