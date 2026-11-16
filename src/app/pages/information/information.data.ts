// Content adapted from the supplied v4 reference and the county's official directory and detention page.
// https://www.hidalgocounty.us/m/directory/department?did=139
// https://www.hidalgocounty.us/3007/Detention
// Jail contact: https://www.hidalgocounty.us/DocumentCenter/View/69772/Your-Guide-to-Victim-Services
// Review these sources when updating contact details or visitation schedules.
export interface Court {
  name: string; phone: string; fax?: string; floor: string; hours?: string; mailing?: string;
  staff: [string, string, string, string?, string?][]; url?: string; notes?: string; email?: string;
  tollFree?: string; hideStaffHeading?: boolean; staffPhotos?: Record<string, string>;
  staffInitials?: Record<string, string>;
}

export const COURTS: Court[] = [
  {
    "name": "District Clerk’s Office",
    "phone": "956-318-2200",
    "fax": "956-318-2251",
    "floor": "2nd Floor",
    "mailing": "District Clerks Office, P.O. Box 87, Edinburg, TX 78539",
    "staff": [],
    "url": "https://www.hidalgocounty.us/m/directory/department?did=139"
  },
  {
    "name": "County Clerk’s Office",
    "phone": "956-318-2100",
    "tollFree": "888-318-2811",
    "hideStaffHeading": true,
    "staffPhotos": { "Arturo Guajardo, Jr.": "assets/images/arturo-guajardo-jr.jpg" },
    "fax": "956-318-2105",
    "floor": "1st Floor",
    "hours": "Monday–Friday, 8:00 AM–5:00 PM",
    "mailing": "Hidalgo County Clerk’s Office, P.O. Box 58, Edinburg, TX 78540",
    "staff": [
      [
        "Arturo Guajardo, Jr.",
        "County Clerk",
        "956-318-2100"
      ]
    ],
    "url": "https://www.hidalgocounty.us/m/directory/department?did=139"
  },
  {
    "name": "District Clerk",
    "staffInitials": { "Laura Hinojosa": "LH" },
    "hideStaffHeading": true,
    "email": "districtclerk@co.hidalgo.tx.us",
    "phone": "956-318-2200",
    "fax": "956-318-2251",
    "floor": "Not listed",
    "hours": "Monday–Friday, 8:00 AM–5:00 PM",
    "mailing": "P.O. Box 87, Edinburg, TX 78539",
    "staff": [
      [
        "Laura Hinojosa",
        "District Clerk",
        "956-318-2200",
        "districtclerk@co.hidalgo.tx.us",
        "Email Laura Hinojosa"
      ]
    ],
    "url": "https://www.hidalgocounty.us/m/directory/department?did=139"
  },
  {
    "name": "County Court #1",
    "hideStaffHeading": true,
    "staffPhotos": { "Rodolfo Gonzalez": "assets/images/rodolfo-gonzalez.png" },
    "phone": "956-318-2375",
    "fax": "956-318-2373",
    "floor": "4th Floor",
    "hours": "Monday–Friday, 8:00 AM–12:00 PM; 1:00–5:00 PM",
    "staff": [
      [
        "Rodolfo Gonzalez",
        "Judge",
        "956-318-2375"
      ]
    ]
  },
  {
    "name": "County Court #2",
    "hideStaffHeading": true,
    "staffInitials": { "Jaime Palacios": "JP" },
    "phone": "956-318-2380",
    "fax": "956-318-2384",
    "floor": "4th Floor",
    "hours": "Monday–Friday, 8:00 AM–5:00 PM",
    "staff": [
      [
        "Jaime Palacios",
        "Judge Court of Law",
        "956-318-2380"
      ]
    ]
  },
  {
    "name": "Probate Court",
    "hideStaffHeading": true,
    "staffInitials": { "Regina Moreno": "RM" },
    "staffPhotos": { "JoAnne Garcia": "assets/images/joanne-garcia.jpg" },
    "phone": "956-318-2385",
    "floor": "3rd Floor",
    "hours": "Monday–Friday, 8:00 AM–5:00 PM",
    "staff": [
      [
        "JoAnne Garcia",
        "Probate Judge",
        "956-318-2385"
      ],
      [
        "Regina Moreno",
        "Court Coordinator",
        "956-318-2385"
      ]
    ]
  },
  {
    "name": "Probate Court 2",
    "hideStaffHeading": true,
    "staffPhotos": { "Aissa I. Garza": "assets/images/aissa-garza.jpg" },
    "phone": "956-292-7631",
    "floor": "Room 3A-100",
    "hours": "Monday–Friday, 8:00 AM–5:00 PM",
    "staff": [
      [
        "Aissa I. Garza",
        "Judge",
        ""
      ]
    ]
  },
  {
    "name": "County Court #4",
    "hideStaffHeading": true,
    "staffPhotos": { "Fred Garza": "assets/images/fred-garza.jpg" },
    "phone": "956-318-2390",
    "floor": "4th Floor",
    "staff": [
      [
        "Fred Garza",
        "Judge Court at Law",
        "956-318-2390"
      ]
    ]
  },
  {
    "name": "County Court #5",
    "hideStaffHeading": true,
    "staffPhotos": { "Arnoldo Cantu": "assets/images/arnoldo-cantu.jpg" },
    "phone": "956-318-2460",
    "fax": "956-318-2463",
    "floor": "4th Floor",
    "staff": [
      [
        "Arnoldo Cantu",
        "Judge Court at Law",
        "956-318-2460"
      ]
    ]
  },
  {
    "name": "County Court #6",
    "hideStaffHeading": true,
    "staffPhotos": { "Albert Garcia": "assets/images/albert-garcia.jpg" },
    "staffInitials": { "Pedro Lobato": "PL" },
    "phone": "956-289-7400",
    "fax": "956-289-7812",
    "floor": "4th Floor",
    "hours": "Monday–Friday, 8:00 AM–5:00 PM",
    "staff": [
      [
        "Albert Garcia",
        "Judge",
        "956-289-7400"
      ],
      [
        "Pedro Lobato",
        "Court Coordinator",
        "",
        "pedro.lobato@co.hidalgo.tx.us"
      ]
    ]
  },
  {
    "name": "County Court #7",
    "hideStaffHeading": true,
    "staffInitials": { "Sergio Valdez": "SV" },
    "phone": "956-292-7780",
    "floor": "5th Floor",
    "hours": "Monday–Friday, 8:00 AM–5:00 PM",
    "staff": [
      [
        "Sergio Valdez",
        "Judge",
        "956-292-7780"
      ]
    ]
  },
  {
    "name": "County Court #8",
    "hideStaffHeading": true,
    "staffInitials": { "Omar Maldonado": "OM" },
    "phone": "956-292-7740",
    "floor": "5th Floor",
    "hours": "Monday–Friday, 8:00 AM–5:00 PM",
    "staff": [
      [
        "Omar Maldonado",
        "Judge",
        "956-292-7740"
      ]
    ]
  },
  {
    "name": "County Court #9",
    "hideStaffHeading": true,
    "staffPhotos": { "Patricia O’Caña-Olivarez": "assets/images/patricia-ocana-olivarez.jpg" },
    "staffInitials": {
      "Letty Castañeda": "LC",
      "Francisco Javier Fuentes Jr.": "FF",
      "Lisa M. Flores": "LF",
      "Robert Rodriguez Jr.": "RR"
    },
    "phone": "956-292-7036",
    "floor": "5th Floor",
    "hours": "Monday–Friday, 8:00 AM–5:00 PM",
    "staff": [
      [
        "Patricia O’Caña-Olivarez",
        "Judge",
        "956-292-7036"
      ],
      [
        "Letty Castañeda",
        "Court Coordinator",
        "956-292-7036 Ext. 6662"
      ],
      [
        "Francisco Javier Fuentes Jr.",
        "Assistant Court Coordinator",
        "956-292-7036 Ext. 6661"
      ],
      [
        "Lisa M. Flores",
        "Court Reporter",
        "956-292-7036 Ext. 6665"
      ],
      [
        "Robert Rodriguez Jr.",
        "Bailiff",
        "956-292-7036 Ext. 6663"
      ]
    ]
  },
  {
    "name": "County Court #10",
    "hideStaffHeading": true,
    "staffInitials": {
      "Armando J. Marroquin": "AM",
      "Robert Ramon": "RR",
      "Brenda Gonzalez": "BG",
      "Jovanny Cruz": "JC",
      "Alex Garcia": "AG"
    },
    "phone": "956-292-7042",
    "floor": "5th Floor",
    "hours": "Monday–Friday, 8:00 AM–5:00 PM",
    "mailing": "100 N. Closner Blvd., 5th Floor, Edinburg, TX 78539",
    "staff": [
      [
        "Armando J. Marroquin",
        "Judge",
        "956-292-7042"
      ],
      [
        "Robert Ramon",
        "Court Coordinator",
        "Ext. 6653",
        "robert.ramon@co.hidalgo.tx.us"
      ],
      [
        "Brenda Gonzalez",
        "Assistant Court Coordinator",
        "Ext. 6654",
        "brenda.gonzalez@co.hidalgo.tx.us"
      ],
      [
        "Jovanny Cruz",
        "Court Reporter",
        "Ext. 6652",
        "jovanny.cruz@co.hidalgo.tx.us"
      ],
      [
        "Alex Garcia",
        "Bailiff",
        ""
      ]
    ]
  }
];

export interface VisitationArea {
  location?: string;
  items: string[];
  /** Official county list numbering when it does not start at 1 */
  listStart?: number;
}

export type VisitationSlot = VisitationArea[] | null;

/** Weekly slots synced with https://www.hidalgocounty.us/3007/Detention */
export const VISITATION: VisitationSlot[][] = [
  [
    [
      { location: 'Alpha/Bravo', items: ['Bravo 12 thru 21', 'Infirmary Females Only'] },
      { location: 'Charlie', items: ['Charlie 1 thru 12'] },
      { location: 'Main Lobby', items: ['Echo (Non P/C or Disciplinary)', 'Infirmary Males'] }
    ],
    [
      { location: 'Alpha/Bravo', items: ['Alpha', 'Bravo General Population', 'Bravo 1 thru 11'] },
      { location: 'Charlie', items: ['Charlie General Population', 'Charlie 13 thru 24'] }
    ]
  ],
  [
    [
      { location: 'Alpha/Bravo', items: ['Alpha', 'Bravo General Population', 'Bravo 1 thru 11'] },
      { location: 'Charlie', items: ['Charlie General Population', 'Charlie 13 thru 24'] }
    ],
    [
      { location: 'Alpha/Bravo', items: ['Bravo 12 thru 21', 'Infirmary Females Only'] },
      { location: 'Charlie', items: ['Charlie 1 thru 12'] },
      { location: 'Main Lobby', items: ['Echo (Non P/C or Disciplinary)', 'Infirmary Males'] }
    ]
  ],
  [
    [{ location: 'Main Lobby', items: ['Gulf Section', 'Charlie 13 thru 30', 'Hotel 2'] }],
    [{ location: 'Main Lobby', items: ['Protective Custody Inmates'] }]
  ],
  [
    [{ location: 'Main Lobby', items: ['Protective Custody Inmates'] }],
    [{ location: 'Main Lobby', items: ['Foxtrot Section', 'Hotel 1'] }]
  ],
  [
    [{ location: 'Main Lobby', items: ['Foxtrot Section', 'Hotel 1'] }],
    [{ location: 'Main Lobby', items: ['Gulf Section', 'Charlie 13 thru 30 (Ex-Gang/Sex Off Only)', 'Hotel 2 (Ex-Gang Only)'] }]
  ],
  [[{ location: 'Main Lobby', items: ['Delta Section'] }], null],
  [null, [{ location: 'Main Lobby', items: ['Delta Section'], listStart: 2 }]]
];

export const VISITATION_SLOT_HOURS = ['8:00 AM – 2:00 PM', '3:00 PM – 9:00 PM'] as const;
