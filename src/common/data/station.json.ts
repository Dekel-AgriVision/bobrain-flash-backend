import { CreateStationDto } from 'src/core/dto/setting/create-station.dto';

// Default Front stations
export const getDefaultStations = () => {
  return <CreateStationDto[]>[
    {
      code: 'AY1',
      displayName: 'AYENOUAN 1',
      isActive: true,
    },
  ];
};
