import { CreateStationDto } from 'src/core/dto/setting/create-station.dto';

// Default Front stations
export const getDefaultStations = () => {
  return <CreateStationDto[]>[
    {
      code: 'AY1',
      displayName: 'AYENOUAN 1',
      isActive: true,
    },
    {
      code: 'AY2',
      displayName: 'AYENOUAN 2',
      isActive: true,
    },
    {
      code: 'EB1',
      displayName: 'EBOUE 1',
      isActive: true,
    },
    {
      code: 'AL1',
      displayName: 'ALLAKRO 1',
      isActive: true,
    },
    {
      code: 'AD1',
      displayName: 'ADIAKE 1',
      isActive: true,
    },
    {
      code: 'MA1',
      displayName: 'MALAMALAKRO 1',
      isActive: true,
    },
     {
      code: 'ET1',
      displayName: 'ETUOBOUE 1',
      isActive: true,
    },
    {
      code: 'AK1',
      displayName: 'AKRESSI',
      isActive: true,
    },
 {
      code: 'JE1',
      displayName: 'JERUSALEM 1',
      isActive: true,
    },


  ];
};
