import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ExternalLink, Heart, MoreVertical, Pencil } from "lucide-react";
import { useI18n } from "@/hooks/use-i18n";

// --- TYPE DEFINITIONS ---
interface Contributor {
  src: string;
  alt: string;
  fallback: string;
}

type StatusVariant = "active" | "inProgress" | "onHold";

export interface Project {
  id: string;
  name: string;
  repository?: string;
  team?: string;
  tech?: string;
  createdAt: string;
  contributors: Contributor[];
  status: {
    text: string;
    variant: StatusVariant;
  };
  isFavorite?: boolean;
}

// --- PROPS INTERFACE ---
interface ProjectDataTableProps {
  projects: Project[];
  visibleColumns: Set<keyof Project>;
  onRowClick?: (project: Project) => void;
  onFavorite?: (project: Project) => void;
  onEdit?: (project: Project) => void;
  currentPage?: number;
  pageSize?: number;
  totalItems?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
}

// --- STATUS BADGE VARIANTS ---
const badgeVariants = cva("capitalize text-white text-xs", {
  variants: {
    variant: {
      active: "bg-green-500 hover:bg-green-600",
      inProgress: "bg-yellow-500 hover:bg-yellow-600",
      onHold: "bg-red-500 hover:bg-red-600",
    },
  },
  defaultVariants: {
    variant: "active",
  },
});

// --- MAIN COMPONENT ---
export const ProjectDataTable = ({ 
  projects, 
  visibleColumns,
  onRowClick,
  onFavorite,
  onEdit,
  currentPage = 1,
  pageSize = 10,
  totalItems = 0,
  onPageChange,
  onPageSizeChange,
}: ProjectDataTableProps) => {
  const { t } = useI18n();
  // Animation variants for table rows
  const rowVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.05,
        duration: 0.3,
        ease: "easeInOut",
      },
    }),
  };
  
  const tableHeaders: { key: keyof Project | 'actions'; label: string }[] = [
    { key: "name", label: t('dashboard.management.table.name') },
    { key: "repository", label: t('dashboard.management.table.name') },
    { key: "team", label: t('dashboard.management.table.team') },
    { key: "tech", label: t('dashboard.management.table.tech') },
    { key: "createdAt", label: t('dashboard.management.table.createdAt') },
    { key: "contributors", label: t('dashboard.management.table.contributors') },
    { key: "status", label: t('dashboard.management.table.status') },
    { key: "actions", label: t('dashboard.management.table.actions') },
  ];

  const totalPages = Math.ceil(totalItems / pageSize);
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="rounded-lg border border-border bg-card shadow-sm">
      <div className="relative w-full overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {tableHeaders
                .filter((header) => header.key === 'actions' || visibleColumns.has(header.key as keyof Project))
                .map((header) => (
                  <TableHead key={header.key} className="text-xs">{header.label}</TableHead>
                ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.length > 0 ? (
              projects.map((project, index) => (
                <motion.tr
                  key={project.id}
                  custom={index}
                  initial="hidden"
                  animate="visible"
                  variants={rowVariants}
                  onClick={() => onRowClick?.(project)}
                  className={cn(
                    "border-b border-border transition-colors hover:bg-muted/50 cursor-pointer",
                    "data-[state=selected]:bg-muted"
                  )}
                >
                  {visibleColumns.has("name") && (
                    <TableCell className="font-medium text-sm">{project.name}</TableCell>
                  )}
                  
                  {visibleColumns.has("repository") && project.repository && (
                    <TableCell>
                      <a
                        href={project.repository}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground text-sm"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span className="truncate max-w-xs">{project.repository.replace('https://', '')}</span>
                        <ExternalLink className="h-3 w-3 flex-shrink-0" />
                      </a>
                    </TableCell>
                  )}
                  
                  {visibleColumns.has("team") && project.team && (
                    <TableCell className="text-sm">{project.team}</TableCell>
                  )}
                  {visibleColumns.has("tech") && project.tech && (
                    <TableCell className="text-sm">{project.tech}</TableCell>
                  )}
                  {visibleColumns.has("createdAt") && (
                    <TableCell className="text-sm text-muted-foreground">{project.createdAt}</TableCell>
                  )}
                  
                  {visibleColumns.has("contributors") && (
                    <TableCell>
                      <div className="flex -space-x-2">
                        {project.contributors.slice(0, 3).map((contributor, idx) => (
                          <Avatar key={idx} className="h-7 w-7 border-2 border-background">
                            <AvatarImage src={contributor.src} alt={contributor.alt} />
                            <AvatarFallback className="text-xs">{contributor.fallback}</AvatarFallback>
                          </Avatar>
                        ))}
                        {project.contributors.length > 3 && (
                          <div className="h-7 w-7 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                            <span className="text-xs text-muted-foreground">+{project.contributors.length - 3}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                  )}

                  {visibleColumns.has("status") && (
                    <TableCell>
                      <Badge className={cn(badgeVariants({ variant: project.status.variant }))}>
                        {project.status.text}
                      </Badge>
                    </TableCell>
                  )}

                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            onFavorite?.(project);
                          }}
                        >
                          <Heart
                            className={cn(
                              "mr-2 h-4 w-4",
                              project.isFavorite && "fill-red-500 text-red-500"
                            )}
                          />
                          {project.isFavorite
                            ? t('dashboard.management.unfavorite')
                            : t('dashboard.management.favorite')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit?.(project);
                          }}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          {t('dashboard.management.edit')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </motion.tr>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={visibleColumns.size + 1} className="h-24 text-center text-sm text-muted-foreground">
                  {t('dashboard.management.noResults')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Pagination */}
      {totalItems > 0 && onPageChange && (
        <div className="flex flex-col gap-4 border-t border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-muted-foreground">
            {t('dashboard.management.pagination.showing')} {startItem} {t('dashboard.management.pagination.to')} {endItem} {t('dashboard.management.pagination.of')} {totalItems} {t('dashboard.management.pagination.results')}
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="h-8"
            >
              Anterior
            </Button>
            
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">{t('dashboard.management.pagination.page')}</span>
              <span className="font-medium">{currentPage}</span>
              <span className="text-muted-foreground">{t('dashboard.management.pagination.of')}</span>
              <span className="font-medium">{totalPages}</span>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="h-8"
            >
              Próximo
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
