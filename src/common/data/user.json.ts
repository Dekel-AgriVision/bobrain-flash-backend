import { CreateUserDto } from 'src/core/dto/user/create-user.dto';

// Default users
export const getDefaultUsers = () => {
  const defaultUser = process.env.DEFAULT_USER;
  const defaultUserPassword = process.env.DEFAULT_USER_PASSWORD;
  if (!defaultUser || !defaultUserPassword) {
    throw new Error(
      'DEFAULT_USER and DEFAULT_USER_PASSWORD environment variables must be set',
    );
  }
  return <CreateUserDto[]>[
    {
      username: defaultUser,
      newPassword: defaultUserPassword,
      email: 'admin@localhost',
      isActive: true,
      firstName: 'Bahi Boris',
      lastName: 'BAHI',
    },
  ];
};


