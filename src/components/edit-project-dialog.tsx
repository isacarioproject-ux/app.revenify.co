import { useState, useEffect } from 'react';
import { useI18n } from '@/hooks/use-i18n';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Project } from '@/components/ui/project-data-table';
import { toast } from 'sonner';

type StatusVariant = 'active' | 'inProgress' | 'onHold';

interface EditProjectDialogProps {
  project: Project | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (project: Project) => void;
}

export function EditProjectDialog({
  project,
  open,
  onOpenChange,
  onSave,
}: EditProjectDialogProps) {
  const { t } = useI18n();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: project?.name || '',
    team: project?.team || '',
    tech: project?.tech || '',
    repository: project?.repository || '',
    status: (project?.status.variant || 'active') as StatusVariant,
  });

  // Atualizar form quando project mudar
  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name,
        team: project.team || '',
        tech: project.tech || '',
        repository: project.repository || '',
        status: project.status.variant as StatusVariant,
      });
    }
  }, [project]);

  const handleSave = async () => {
    if (!project) return;

    setSaving(true);
    try {
      // Simular salvamento (substituir com API real)
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const updatedProject: Project = {
        ...project,
        name: formData.name,
        team: formData.team,
        tech: formData.tech,
        repository: formData.repository,
        status: {
          text: t(`dashboard.management.status.${formData.status}`),
          variant: formData.status,
        },
      };

      onSave(updatedProject);
      toast.success(t('dashboard.management.dialog.success'));
      onOpenChange(false);
    } catch (error) {
      toast.error(t('dashboard.management.dialog.error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-lg">{t('dashboard.management.dialog.title')}</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {project?.name}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name" className="text-sm">
              {t('dashboard.management.dialog.name')}
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={t('dashboard.management.dialog.namePlaceholder')}
              className="h-9"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="team" className="text-sm">
              {t('dashboard.management.dialog.team')}
            </Label>
            <Input
              id="team"
              value={formData.team}
              onChange={(e) => setFormData({ ...formData, team: e.target.value })}
              placeholder={t('dashboard.management.dialog.teamPlaceholder')}
              className="h-9"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="tech" className="text-sm">
              {t('dashboard.management.dialog.tech')}
            </Label>
            <Input
              id="tech"
              value={formData.tech}
              onChange={(e) => setFormData({ ...formData, tech: e.target.value })}
              placeholder={t('dashboard.management.dialog.techPlaceholder')}
              className="h-9"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="repository" className="text-sm">
              {t('dashboard.management.dialog.repository')}
            </Label>
            <Input
              id="repository"
              value={formData.repository}
              onChange={(e) => setFormData({ ...formData, repository: e.target.value })}
              placeholder={t('dashboard.management.dialog.repositoryPlaceholder')}
              className="h-9"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="status" className="text-sm">
              {t('dashboard.management.dialog.status')}
            </Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value as StatusVariant })}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">
                  {t('dashboard.management.status.active')}
                </SelectItem>
                <SelectItem value="inProgress">
                  {t('dashboard.management.status.inProgress')}
                </SelectItem>
                <SelectItem value="onHold">
                  {t('dashboard.management.status.onHold')}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
            className="h-9"
          >
            {t('dashboard.management.dialog.cancel')}
          </Button>
          <Button type="button" onClick={handleSave} disabled={saving} className="h-9">
            {saving
              ? t('dashboard.management.dialog.saving')
              : t('dashboard.management.dialog.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
