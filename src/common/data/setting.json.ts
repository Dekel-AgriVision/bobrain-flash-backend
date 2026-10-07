import { CreateSettingDto } from "src/core/dto/setting/create-setting.dto";

// Default users
export const getDefaultSettings = () => {
  return <CreateSettingDto[]>[
    {
      name: 'branch',
      displayName: 'info branche',
      value: 'example : DKL',
    },
    {
      name: 'station',
      displayName: 'info station',
      value: 'Ex: AY1',
    },
    {
      name: 'loginuri',
      displayName: 'info login uri',
      value: 'Ex : auth/login',
    },
    {
      name: 'loginuri',
      displayName: 'info login uri',
      value: 'Ex : auth/login',
    },
    {
      name: 'apiurl',
      displayName: 'info api url',
      value: 'Ex : http://localhost',
    },
    {
      name: 'apiuri',
      displayName: 'info api uri',
      value: 'Ex : flash-backend/api/v1',
    },
    {
      name: 'apiport',
      displayName: 'info api port',
      value: 'Ex : 3336',
    },
    {
      name: 'socketnamespace',
      displayName: 'info socketnamespace',
      value: '/ws',
    },
    {
      name: 'staledelay',
      displayName: 'info staledelay',
      value: '20000',
    },
    {
      name: 'stopdelay',
      displayName: 'info stopdelay',
      value: '20000',
    },
    {
      name: 'frenetkeypath',
      displayName: 'info frenetkeypath',
      value: 'Ex : C:BoBrainRWBv2key.key',
    },
    {
      name: 'rootdir',
      displayName: 'info rootdir',
      value: 'Ex: C:BoBrainRWBv2',
    },
  ];
};
