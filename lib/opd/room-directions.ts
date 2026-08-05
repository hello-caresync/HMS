/** Indoor wayfinding for OPD consultation rooms */

export type RoomDirection = {
  roomNumber: string;
  floor: string;
  wing: string;
  steps: string[];
  landmark: string;
};

const ROOM_MAP: Record<string, RoomDirection> = {
  'Room 1': {
    roomNumber: 'Room 1',
    floor: 'Ground Floor',
    wing: 'Pediatrics Wing',
    landmark: 'Near main reception desk',
    steps: [
      'Enter through main lobby',
      'Turn right at the information desk',
      'Walk 20m — Pediatrics Wing sign',
      'Room 1 is first door on your left',
    ],
  },
  'Room 2': {
    roomNumber: 'Room 2',
    floor: 'Ground Floor',
    wing: 'General OPD Block A',
    landmark: 'Opposite pharmacy counter',
    steps: [
      'From reception, proceed straight into Block A',
      'Pass the vitals station on your right',
      'Room 2 is the second consultation room',
    ],
  },
  'Room 4': {
    roomNumber: 'Room 4',
    floor: 'First Floor',
    wing: 'Cardiology Suite',
    landmark: 'Elevator B, first floor',
    steps: [
      'Take Elevator B to First Floor',
      'Exit left toward Cardiology Suite',
      'Follow purple corridor markers',
      'Room 4 is at the end of the hallway',
    ],
  },
  'Room 6': {
    roomNumber: 'Room 6',
    floor: 'Second Floor',
    wing: 'Orthopedics Block',
    landmark: 'Near physiotherapy unit',
    steps: [
      'Take stairs or Elevator A to Second Floor',
      'Turn right at Orthopedics reception',
      'Room 6 is third door on the right',
    ],
  },
};

export function getRoomDirections(roomNumber?: string): RoomDirection | null {
  if (!roomNumber) return null;
  const normalized = roomNumber.startsWith('Room') ? roomNumber : `Room ${roomNumber.replace(/\D/g, '')}`;
  return ROOM_MAP[normalized] ?? ROOM_MAP[roomNumber] ?? null;
}
