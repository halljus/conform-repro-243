import type { ContributingFactor } from '@prisma/client';
import { prisma } from '~/core/db.server';
import type { ArchivableOptionGroup, ArchivableSelectOption } from '~/core/types';

function toArchivableOption(contributingFactor: ContributingFactor): ArchivableSelectOption {
  return {
    label: contributingFactor.name,
    value: contributingFactor.id,
    archived: contributingFactor.archived,
  };
}

export async function getGroupedContributingFactorOptions(): Promise<ArchivableOptionGroup[]> {
  const contributingFactors = await prisma.contributingFactor.findMany({
    orderBy: { name: 'asc' },
  });

  return [
    {
      label: 'Active',
      options: contributingFactors.filter(({ archived }) => !archived).map(toArchivableOption),
    },
    {
      label: 'Archived',
      options: contributingFactors.filter(({ archived }) => archived).map(toArchivableOption),
    },
  ];
}

export async function getActiveContributingFactorOptions() {
  const contributingFactors = await prisma.contributingFactor.findMany({
    where: { archived: false },
    orderBy: { name: 'asc' },
  });

  return contributingFactors.map((contributingFactor) => ({
    label: contributingFactor.name,
    value: contributingFactor.id,
  }));
}

export async function createContributingFactor(name: string) {
  return prisma.contributingFactor.create({
    data: { name },
  });
}

export async function isExistingContributingFactor(name: string) {
  const existingContributingFactor = await prisma.contributingFactor.findUnique({
    where: { name },
  });

  return Boolean(existingContributingFactor);
}
