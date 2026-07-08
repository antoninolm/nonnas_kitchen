import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import connectDB from "./db.js";
import User from "./models/User.js";
import HostProfile from "./models/HostProfile.js";
import Experience from "./models/Experience.js";

const DAY_MS = 24 * 60 * 60 * 1000;

const usersData = [
  {
    key: "manager",
    name: "Marco Ferrari",
    email: "manager@demo.com",
    password: "password123",
  },
  {
    key: "guest",
    name: "Giulia Conti",
    email: "guest@demo.com",
    password: "password123",
  },
  {
    key: "filler",
    name: "Elena Russo",
    email: "elena.russo@example.com",
    password: "password123",
  },
];

const hostProfilesData = [
  {
    key: "carmela",
    displayName: "Nonna Carmela",
    bio: "Carmela cucina a Roma da oltre cinquant'anni. Ha imparato le ricette della tradizione romana da sua madre, tra cui la pasta fresca fatta a mano ogni domenica.",
    city: "Rome",
    neighborhood: "Trastevere",
    photos: [
      "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800",
      "https://images.unsplash.com/photo-1600891964092-4316c288032e?w=800",
    ],
    managerKeys: ["manager"],
  },
  {
    key: "assunta",
    displayName: "Nonna Assunta",
    bio: "Assunta vive nel cuore di Napoli, dove ha cresciuto cinque figli tra pizze, sfogliatelle e il profumo del sugo la domenica mattina.",
    city: "Naples",
    neighborhood: "Quartieri Spagnoli",
    photos: [
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800",
      "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=800",
    ],
    managerKeys: ["manager"],
  },
  {
    key: "salvatore",
    displayName: "Nonno Salvatore",
    bio: "Salvatore ha gestito una piccola trattoria di famiglia per trent'anni. Oggi condivide i segreti del ragù napoletano, cotto lentamente per ore.",
    city: "Naples",
    neighborhood: "Vomero",
    photos: [
      "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800",
    ],
    managerKeys: ["filler"],
  },
  {
    key: "rosa",
    displayName: "Nonna Rosa",
    bio: "Rosa è nata e cresciuta a Roma. La sua cucina profuma sempre di cacio e pepe e supplì appena fritti, come quando era bambina nel quartiere di Testaccio.",
    city: "Rome",
    neighborhood: "Testaccio",
    photos: [
      "https://images.unsplash.com/photo-1607330289024-1535c6b4e1c1?w=800",
    ],
    managerKeys: ["filler"],
  },
  {
    key: "pina",
    displayName: "Nonna Pina",
    bio: "Pina è famosa nel suo quartiere per la pastiera napoletana, che prepara ogni anno seguendo la ricetta tramandata da sua nonna.",
    city: "Naples",
    neighborhood: "Chiaia",
    photos: [
      "https://images.unsplash.com/photo-1595295333158-4742f28fbd85?w=800",
    ],
    managerKeys: ["filler"],
  },
];

const experiencesData = [
  {
    hostKey: "carmela",
    title: "Sunday Cacio e Pepe with Nonna Carmela",
    recipeName: "Cacio e Pepe",
    story:
      "Una ricetta di soli tre ingredienti, ma che richiede una mano esperta. Carmela vi insegnerà il gesto giusto per la mantecatura perfetta.",
    daysFromNow: 18,
    durationMin: 150,
    price: 5500,
    seatsTotal: 6,
    seatsBooked: 1,
    address: "Via della Lungaretta 45, 00153 Roma",
    photos: ["https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800"],
    tags: ["pasta", "roman", "vegetarian"],
  },
  {
    hostKey: "carmela",
    title: "Roman Carbonara Masterclass",
    recipeName: "Carbonara",
    story:
      "Niente panna, solo guanciale, uova, pecorino e pepe. Carmela sfata i miti e vi guida passo dopo passo verso la vera carbonara romana.",
    daysFromNow: 32,
    durationMin: 180,
    price: 6000,
    seatsTotal: 6,
    seatsBooked: 0,
    address: "Via della Lungaretta 45, 00153 Roma",
    photos: [
      "https://images.unsplash.com/photo-1600891964092-4316c288032e?w=800",
    ],
    tags: ["pasta", "roman"],
  },
  {
    hostKey: "assunta",
    title: "Neapolitan Pizza Night",
    recipeName: "Pizza Napoletana",
    story:
      "Impasto a lunga lievitazione, pomodoro San Marzano e fior di latte. Assunta vi mostra come nasce una vera pizza napoletana, dal forno di casa sua.",
    daysFromNow: 25,
    durationMin: 210,
    price: 7000,
    seatsTotal: 8,
    seatsBooked: 3,
    address: "Via Toledo 112, 80134 Napoli",
    photos: ["https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=800"],
    tags: ["pizza", "neapolitan"],
  },
  {
    hostKey: "assunta",
    title: "Sfogliatella Baking with Nonna Assunta",
    recipeName: "Sfogliatella",
    story:
      "Strati sottilissimi di pasta sfoglia e un ripieno di semolino e ricotta. Un dolce che richiede pazienza, come tutte le cose buone.",
    daysFromNow: 47,
    durationMin: 200,
    price: 6500,
    seatsTotal: 5,
    seatsBooked: 0,
    address: "Via Toledo 112, 80134 Napoli",
    photos: [
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800",
    ],
    tags: ["dessert", "baking", "neapolitan"],
  },
  {
    hostKey: "salvatore",
    title: "Sunday Ragù, All Day Long",
    recipeName: "Ragù Napoletano",
    story:
      "Il ragù di Salvatore cuoce per ore, come vuole la tradizione della domenica napoletana. Un'esperienza lenta, tra racconti di famiglia e profumi di casa.",
    daysFromNow: 40,
    durationMin: 240,
    price: 6000,
    seatsTotal: 8,
    seatsBooked: 2,
    address: "Via Scarlatti 30, 80129 Napoli",
    photos: [
      "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800",
    ],
    tags: ["neapolitan", "sauce", "sunday-lunch"],
  },
  {
    hostKey: "salvatore",
    title: "Struffoli for the Holidays",
    recipeName: "Struffoli",
    story:
      "Palline di pasta fritta, miele e canditi: il dolce delle feste per eccellenza a Napoli. Salvatore vi svela il trucco per farle croccanti fuori e morbide dentro.",
    daysFromNow: 62,
    durationMin: 180,
    price: 5000,
    seatsTotal: 10,
    seatsBooked: 4,
    address: "Via Scarlatti 30, 80129 Napoli",
    photos: [
      "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800",
    ],
    tags: ["dessert", "holiday", "neapolitan"],
  },
  {
    hostKey: "rosa",
    title: "Supplì and Roman Street Food",
    recipeName: "Supplì",
    story:
      "Riso, ragù e mozzarella filante racchiusi in una panatura croccante. Rosa vi porta nella cucina di strada romana, direttamente a casa sua.",
    daysFromNow: 21,
    durationMin: 150,
    price: 4500,
    seatsTotal: 8,
    seatsBooked: 1,
    address: "Via Marmorata 78, 00153 Roma",
    photos: [
      "https://images.unsplash.com/photo-1607330289024-1535c6b4e1c1?w=800",
    ],
    tags: ["street-food", "roman", "vegetarian"],
  },
  {
    hostKey: "rosa",
    title: "Homemade Tonnarelli Cacio e Pepe",
    recipeName: "Tonnarelli Cacio e Pepe",
    story:
      "Si parte dall'impasto: farina, uova e la trafila giusta per i tonnarelli. Rosa vi guida dalla sfoglia al piatto, in pieno stile romano.",
    daysFromNow: 55,
    durationMin: 180,
    price: 5800,
    seatsTotal: 6,
    seatsBooked: 0,
    address: "Via Marmorata 78, 00153 Roma",
    photos: [
      "https://images.unsplash.com/photo-1607330289024-1535c6b4e1c1?w=800",
    ],
    tags: ["pasta", "roman"],
  },
  {
    hostKey: "pina",
    title: "Easter Pastiera Baking Day",
    recipeName: "Pastiera Napoletana",
    story:
      "Grano cotto, ricotta e fiori d'arancio: la pastiera è il dolce simbolo della Pasqua napoletana. Pina la prepara come faceva sua nonna, senza fretta.",
    daysFromNow: 70,
    durationMin: 210,
    price: 6200,
    seatsTotal: 6,
    seatsBooked: 2,
    address: "Via Chiaia 55, 80121 Napoli",
    photos: [
      "https://images.unsplash.com/photo-1595295333158-4742f28fbd85?w=800",
    ],
    tags: ["dessert", "easter", "baking", "neapolitan"],
  },
];

async function seed() {
  if (!process.env.MONGODB_URI) {
    console.error(
      "Missing MONGODB_URI environment variable. Did you copy server/.env.example to server/.env?",
    );
    process.exit(1);
  }

  await connectDB(process.env.MONGODB_URI);
  console.log("Connected to MongoDB");

  await Promise.all([
    User.deleteMany({}),
    HostProfile.deleteMany({}),
    Experience.deleteMany({}),
  ]);
  console.log("Cleared existing users, host profiles and experiences");

  const hashedUsers = await Promise.all(
    usersData.map(async ({ key, password, ...rest }) => ({
      ...rest,
      password: await bcrypt.hash(password, 10),
    })),
  );
  const createdUsers = await User.create(hashedUsers);
  const userIdByKey = Object.fromEntries(
    usersData.map((u, i) => [u.key, createdUsers[i]._id]),
  );
  console.log(`Created ${createdUsers.length} users`);

  const createdHosts = await HostProfile.create(
    hostProfilesData.map(({ key, managerKeys, ...rest }) => ({
      ...rest,
      managers: managerKeys.map((managerKey) => userIdByKey[managerKey]),
    })),
  );
  const hostIdByKey = Object.fromEntries(
    hostProfilesData.map((h, i) => [h.key, createdHosts[i]._id]),
  );
  console.log(`Created ${createdHosts.length} host profiles`);

  const createdExperiences = await Experience.create(
    experiencesData.map(({ hostKey, daysFromNow, ...rest }) => ({
      ...rest,
      host: hostIdByKey[hostKey],
      date: new Date(Date.now() + daysFromNow * DAY_MS),
      status: "published",
    })),
  );
  console.log(`Created ${createdExperiences.length} experiences`);

  console.log("Seed complete. Demo logins (password: password123):");
  console.log("  manager@demo.com — manages Nonna Carmela and Nonna Assunta");
  console.log("  guest@demo.com   — guest account");

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
