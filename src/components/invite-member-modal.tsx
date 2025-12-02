import React, { useState } from 'react';
import {
	Modal,
	ModalBody,
	ModalContent,
	ModalDescription,
	ModalFooter,
	ModalHeader,
	ModalTitle,
	ModalTrigger,
} from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { UserPlus, Mail, Shield, Eye, Edit3, Loader2 } from 'lucide-react';
import { useI18n } from '@/hooks/use-i18n';
import { toast } from 'sonner';
import type { TeamMemberRole } from '@/types/database';

interface InviteMemberModalProps {
	onInvite: (email: string, role: TeamMemberRole, name?: string) => Promise<void>;
	trigger?: React.ReactNode;
}

const roleIcons = {
	admin: Shield,
	member: Edit3,
	viewer: Eye,
};

export function InviteMemberModal({ onInvite, trigger }: InviteMemberModalProps) {
	const { t } = useI18n();
	const [open, setOpen] = useState<boolean>(false);
	const [role, setRole] = useState<TeamMemberRole>('editor');
	const [email, setEmail] = useState('');
	const [name, setName] = useState('');
	const [loading, setLoading] = useState(false);

	const handleInvite = async () => {
		if (!email || !email.includes('@')) {
			toast.error(t('team.emailRequired'));
			return;
		}

		try {
			setLoading(true);
			await onInvite(email, role, name || undefined);
			toast.success(t('team.inviteSent'));
			setEmail('');
			setName('');
			setRole('editor');
			setOpen(false);
		} catch (error) {
			toast.error(t('team.inviteError'));
		} finally {
			setLoading(false);
		}
	};

	return (
		<Modal open={open} onOpenChange={setOpen}>
			<ModalTrigger asChild>
				{trigger || (
					<Button>
						<UserPlus className="mr-2 h-4 w-4" />
						{t('team.inviteMember')}
					</Button>
				)}
			</ModalTrigger>
			<ModalContent className="md:max-w-[420px]">
				<ModalHeader>
					<ModalTitle>{t('team.inviteMember')}</ModalTitle>
					<ModalDescription className="text-sm">
						{t('team.inviteDescription')}
					</ModalDescription>
				</ModalHeader>
				<ModalBody className="space-y-4">
					{/* Email */}
					<div className="space-y-2">
						<Label>{t('team.email')}</Label>
						<Input
							type="email"
							placeholder="joao@empresa.com"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							disabled={loading}
						/>
					</div>

					{/* Role */}
					<div className="space-y-2">
						<Label>{t('team.selectRole')}</Label>
						<RadioGroup
							className="gap-2"
							onValueChange={(value) => setRole(value as TeamMemberRole)}
							value={role}
							disabled={loading}
						>
							{/* Admin */}
							<Label
								htmlFor="admin"
								className="flex items-center gap-3 cursor-pointer rounded-lg border p-3 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5"
							>
								<RadioGroupItem value="admin" id="admin" />
								<Shield className="h-4 w-4 text-purple-500" />
								<span className="text-sm font-medium">{t('team.admin')}</span>
							</Label>

							{/* Editor */}
							<Label
								htmlFor="editor"
								className="flex items-center gap-3 cursor-pointer rounded-lg border p-3 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5"
							>
								<RadioGroupItem value="editor" id="editor" />
								<Edit3 className="h-4 w-4 text-green-500" />
								<span className="text-sm font-medium">Editor</span>
							</Label>

							{/* Viewer */}
							<Label
								htmlFor="viewer"
								className="flex items-center gap-3 cursor-pointer rounded-lg border p-3 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5"
							>
								<RadioGroupItem value="viewer" id="viewer" />
								<Eye className="h-4 w-4 text-blue-500" />
								<span className="text-sm font-medium">{t('team.viewer')}</span>
							</Label>
						</RadioGroup>
					</div>
				</ModalBody>
				<ModalFooter>
					<Button
						type="button"
						onClick={handleInvite}
						className="w-full"
						disabled={loading}
					>
						{loading ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								{t('common.sending')}
							</>
						) : (
							<>
								<Mail className="mr-2 h-4 w-4" />
								{t('team.sendInvite')}
							</>
						)}
					</Button>
				</ModalFooter>
			</ModalContent>
		</Modal>
	);
}
