export type Seat = {
  id: string;
  status: "free" | "reserved" | "held";
};

export type Row = {
  id: string;
  seats: Seat[];
};

export type Section = {
  id: string;
  rows: Row[];
};

export type Side = {
  sections: Section[];
};

export type Stadium = {
  capacity: number;
  sides: {
    up: Side;
    down: Side;
    left: Side;
    right: Side;
  };
};

export function generateStadium(
  capacity: number,
  widthPercent: number,
  sectionsPerSide: number,
  rowsPerSection: number,
  seatsPerRow: number
): Stadium {
  const widthSeats = Math.floor((capacity * widthPercent) / 100);
  const lengthSeats = capacity - widthSeats;

  const distributeSeats = (totalSeats: number, sideName: string): Section[] => {
    const sections: Section[] = [];
    let seatCounter = 1;

    for (let s = 0; s < sectionsPerSide; s++) {
      const section: Section = { id: `${sideName}-section-${s+1}`, rows: [] };
      for (let r = 0; r < rowsPerSection; r++) {
        const row: Row = { id: `${section.id}-row-${r+1}`, seats: [] };
        for (let c = 0; c < seatsPerRow; c++) {
          if (seatCounter > totalSeats) break;
          row.seats.push({
            id: `${row.id}-seat-${c+1}`,
            status: "free",
          });
          seatCounter++;
        }
        if (row.seats.length > 0) section.rows.push(row);
      }
      if (section.rows.length > 0) sections.push(section);
    }
    return sections;
  };

  return {
    capacity,
    sides: {
      up: { sections: distributeSeats(widthSeats / 2, "up") },
      down: { sections: distributeSeats(widthSeats / 2, "down") },
      left: { sections: distributeSeats(lengthSeats / 2, "left") },
      right: { sections: distributeSeats(lengthSeats / 2, "right") },
    },
  };
}
