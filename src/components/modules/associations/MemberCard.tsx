// src/components/modules/associations/MemberCard.tsx
import React from 'react';
import { Mail, Phone, MapPin, Calendar, Crown, Eye, Edit, Trash2 } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { AssociationMember } from '@/types/association/member';
import type { Role } from '@/types/association/role';

interface MemberCardProps {
  member: AssociationMember;
   roles: Role[];
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  canManage: boolean;
  isMultiSection: boolean;
}

export function MemberCard({
  member,
  roles,
  onView,
  onEdit,
  onDelete,
  canManage,
  isMultiSection,
}: MemberCardProps) {
  const statusConfig = {
    active: { variant: 'success' as const, label: 'Actif' },
    pending: { variant: 'warning' as const, label: 'En attente' },
    inactive: { variant: 'secondary' as const, label: 'Inactif' },
    suspended: { variant: 'danger' as const, label: 'Suspendu' },
  };

  const status = statusConfig[member.status] || statusConfig.inactive;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-200 overflow-hidden group">
      {/* Header avec gradient */}
      <div className="h-24 bg-gradient-to-r from-primary/10 to-primary/5 relative">
        <div className="absolute -bottom-12 left-6">
          <Avatar
            firstName={member.user?.firstName}
            lastName={member.user?.lastName}
            imageUrl={member.user?.profilePicture}
            size="xl"
            className="ring-4 ring-white"
          />
        </div>
        {member.isAdmin && (
          <div className="absolute top-4 right-4">
            <div className="bg-yellow-100 p-2 rounded-full">
              <Crown className="h-4 w-4 text-yellow-600" />
            </div>
          </div>
        )}
      </div>

      {/* Contenu */}
      <div className="pt-16 px-6 pb-6">
        {/* Nom et statut */}
        <div className="mb-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900">
              {member.user?.firstName} {member.user?.lastName}
            </h3>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>
          {member.profession && (
            <p className="text-sm text-gray-600">{member.profession}</p>
          )}
        </div>

        {/* Type de membre */}
        <div className="mb-4">
          <Badge variant="secondary" className="text-xs">
            {member.memberType}
          </Badge>
        </div>

        {/* Rôles */}
        {member.assignedRoles && member.assignedRoles.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-medium text-gray-500 mb-2">RÔLES</p>
            <div className="flex flex-wrap gap-1">
              {member.assignedRoles.slice(0, 3).map((roleId) => {
                const role = roles?.find((r) => r.id === roleId);
                return role ? (
                  <Badge
                    key={roleId}
                    variant="secondary"
                    style={{
                      backgroundColor: role.color + '20',
                      color: role.color,
                      borderColor: role.color,
                    }}
                    className="border text-xs"
                  >
                    {role.name}
                  </Badge>
                ) : null;
              })}
              {member.assignedRoles.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{member.assignedRoles.length - 3}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Informations de contact */}
        <div className="space-y-2 mb-4 text-sm">
          {member.user?.phoneNumber && (
            <div className="flex items-center gap-2 text-gray-600">
              <Phone className="h-4 w-4 text-gray-400" />
              <span className="truncate">{member.user.phoneNumber}</span>
            </div>
          )}
          {member.user?.email && (
            <div className="flex items-center gap-2 text-gray-600">
              <Mail className="h-4 w-4 text-gray-400" />
              <span className="truncate">{member.user.email}</span>
            </div>
          )}
          {isMultiSection && member.section && (
            <div className="flex items-center gap-2 text-gray-600">
              <MapPin className="h-4 w-4 text-gray-400" />
              <span className="truncate">{member.section.name}</span>
            </div>
          )}
        </div>

        {/* Date d'adhésion */}
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-4 pt-4 border-t border-gray-100">
          <Calendar className="h-3 w-3" />
          <span>Membre depuis {formatDate(member.joinDate)}</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <Button
            variant="outline"
            size="sm"
            onClick={onView}
            className="flex-1"
          >
            <Eye className="h-4 w-4 mr-1" />
            Voir
          </Button>
          {canManage && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={onEdit}
                className="flex-1"
              >
                <Edit className="h-4 w-4 mr-1" />
                Modifier
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onDelete}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}