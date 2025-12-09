'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';

type ModalProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	defaultOpen?: boolean;
	children: React.ReactNode;
	dialogProps?: React.ComponentProps<typeof Dialog>;
};

const Modal = ({
	dialogProps,
	open,
	onOpenChange,
	children,
}: ModalProps) => {
	return (
		<Dialog open={open} onOpenChange={onOpenChange} {...dialogProps}>
			{children}
		</Dialog>
	);
};

type ModalTriggerProps = {
	className?: string;
	children: React.ReactNode;
	asChild?: boolean;
};

const ModalTrigger = ({
	className,
	children,
	asChild,
}: ModalTriggerProps) => {
	return (
		<DialogTrigger className={className} asChild={asChild}>
			{children}
		</DialogTrigger>
	);
};

type ModalCloseProps = {
	className?: string;
	children?: React.ReactNode;
	asChild?: boolean;
};

const ModalClose = ({
	className,
	children,
	asChild,
}: ModalCloseProps) => {
	return (
		<DialogClose className={className} asChild={asChild}>
			{children}
		</DialogClose>
	);
};

type ModalContentProps = {
	children: React.ReactNode;
	className?: string;
};

const ModalContent = ({
	className,
	children,
}: ModalContentProps) => {
	return (
		<DialogContent className={className}>
			{children}
		</DialogContent>
	);
};

const ModalHeader = ({ className, ...props }: React.ComponentProps<'div'>) => {
	return <DialogHeader className={className} {...props} />;
};

type ModalTitleProps = {
	className?: string;
	children: React.ReactNode;
};

const ModalTitle = ({
	className,
	children,
}: ModalTitleProps) => {
	return (
		<DialogTitle className={className}>
			{children}
		</DialogTitle>
	);
};

type ModalDescriptionProps = {
	className?: string;
	children: React.ReactNode;
};

const ModalDescription = ({
	className,
	children,
}: ModalDescriptionProps) => {
	return (
		<DialogDescription className={className}>
			{children}
		</DialogDescription>
	);
};

const ModalBody = ({ className, ...props }: React.ComponentProps<'div'>) => {
	return <div className={cn('px-4 py-6', className)} {...props} />;
};

const ModalFooter = ({ className, ...props }: React.ComponentProps<'div'>) => {
	return <DialogFooter className={className} {...props} />;
};

export {
	Modal,
	ModalTrigger,
	ModalClose,
	ModalContent,
	ModalDescription,
	ModalHeader,
	ModalTitle,
	ModalBody,
	ModalFooter,
};
