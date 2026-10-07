import { CreateBranchDto } from 'src/core/dto/subsidiary/create-branch.dto';
import { CreateUserDto } from 'src/core/dto/user/create-user.dto';

// Default users
export const getDefaultBranches = () => {
   const defaultBranchCode = process.env.DEFAULT_BRANCH_CODE;
    const defaultBranchName = process.env.DEFAULT_BRANCH_NAME;
    if (!defaultBranchCode || !defaultBranchName) {
      throw new Error(
        'DEFAULT_BRANCH_CODE and DEFAULT_BRANCH_NAME environment variables must be set',
      );
    }
    return <CreateBranchDto[]>[
    {
      code: defaultBranchCode,
      displayName: defaultBranchName,
      city: 'Aboisso',
      isActive: true,
      isParentCompany: true,
    },
  ];
  
};
