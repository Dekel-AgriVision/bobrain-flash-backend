import { CreateErpConnectionDto } from 'src/core/dto/setting/create-erpconnection.dto';

// Default users
export const getDefaultErpconnections = () => {
  return <CreateErpConnectionDto[]>[
    {
      code: 'DKL',
      apiUri: 'branch',
      authUri: 'info branche',
      port: 3000,
      wsUri: '/ws',
      login: 'login',
      password: 'paswword',
      baseUrl: 'sdsd',
      isDefault: true,
    },
  ];
};
