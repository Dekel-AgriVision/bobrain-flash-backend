import { BadRequestException, ConflictException } from '@nestjs/common';
import { BaseEntity, Not } from 'typeorm';
import * as fs from 'file-system';

export type ConstraintOptions = {
  message?: string;
};

export async function isUniqueConstraint(
  property: string,
  target: typeof BaseEntity,
  filter: any,
  options?: ConstraintOptions,
): Promise<boolean> {
  const exists = await makeContraintQuery(target, filter);
  if (exists) {
    throw new ConflictException(
      [
        {
          [property]: [options?.message ?? 'Cet élément existe déjà.'],
        },
      ],
      'Requête en conflit avec une ou plusieurs données',
    );
  }
  return true;
}

export async function isUniqueConstraintBranch(
  property: string,
  target: typeof BaseEntity,
  filter: any,
  options?: ConstraintOptions,
): Promise<boolean> {
  const exists = await makeContraintQuery(target, filter);
  if (exists) {
    throw new ConflictException(
      [
        {
          [property]: [options?.message ?? 'Cet élément existe déjà.'],
        },
      ],
      'Requête en conflit avec une ou plusieurs données',
    );
  }
  return true;
}

export async function isUniqueConstraintUpdate(
  property: string,
  target: typeof BaseEntity,
  filter: any,
  options?: ConstraintOptions,
): Promise<boolean> {
  const option: any = {
    id: Not(filter.id),
    code: filter?.code,
    name: filter?.name,
    displayName: filter?.displayName,
    firstName: filter?.firstName,
    phoneNumber: filter?.phoneNumber,
    email: filter?.email,
    branchId: filter?.branchId,
  };

  const exists = await makeContraintQuery(target, option);
  if (exists) {
    throw new ConflictException(
      [
        {
          [property]: [options?.message ?? 'Cet élément existe déjà.'],
        },
      ],
      'Requête en conflit avec une ou plusieurs données',
    );
  }
  return true;
}

export async function existsConstraint(
  property: string,
  target: typeof BaseEntity,
  filter: any,
  options?: ConstraintOptions,
): Promise<boolean> {
  const exists = await makeContraintQuery(target, filter);
  if (!exists) {
    throw new BadRequestException(
      [
        {
          [property]: [options?.message ?? "Cet élément n'existe pas."],
        },
      ],
      'Requête non valide',
    );
  }
  return true;
}

async function makeContraintQuery(
  target: typeof BaseEntity,
  filter: any,
): Promise<boolean> {
  const count = await target.count({
    where: { ...filter },
  });
  return count > 0;
}

export const removeFile = (fullPathFile: any) => {
  try {
    fs.unlinkSync(fullPathFile);
  } catch (err) {
    console.log(err);
  }
};

export const removeImage = (IMAGE_PATH: string, filename: any) => {
  const _image = `./${IMAGE_PATH}/${filename}`;
  if (fs.existsSync(_image)) {
    removeFile(_image);
  }
};
