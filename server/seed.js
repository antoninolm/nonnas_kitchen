import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import connectDB from "./db.js";
import User from "./models/User.js";
import HostProfile from "./models/HostProfile.js";
import Experience from "./models/Experience.js";
import Booking from "./models/Booking.js";
import Review from "./models/Review.js";

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
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200",
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
    dietaryOptions: ["vegetariano"],
    menu: ["Cacio e pepe", "Insalata di stagione", "Un bicchiere di vino bianco"],
    languagesSpoken: ["Italiano", "un po' di inglese"],
    conversationTopics: ["Ricette di famiglia", "Vita di quartiere a Trastevere"],
    houseRules:
      "Si mangia tutti insieme, niente telefoni a tavola. Togliersi le scarpe all'ingresso.",
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
    menu: ["Carbonara", "Puntarelle in insalata", "Torta di ricotta della casa"],
    languagesSpoken: ["Italiano", "English"],
    conversationTopics: ["Miti da sfatare sulla carbonara", "Aneddoti di famiglia"],
    houseRules: "Guanciale sì, panna mai: qui si cucina secondo tradizione.",
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
    dietaryOptions: ["vegetariano"],
    menu: ["Pizza Margherita", "Pizza Marinara", "Babà al rum"],
    languagesSpoken: ["Italiano", "English"],
    conversationTopics: [
      "Segreti dell'impasto napoletano",
      "Quartieri Spagnoli e la vita di Napoli",
    ],
    houseRules: "Il forno è acceso da ore: attenzione al calore vicino alla cucina.",
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
    dietaryOptions: ["vegetariano"],
    menu: ["Sfogliatella riccia", "Sfogliatella frolla", "Caffè napoletano"],
    languagesSpoken: ["Italiano"],
    conversationTopics: ["La pasticceria napoletana", "Ricordi di famiglia"],
    houseRules: "Le mani in pasta: grembiule fornito, capelli legati.",
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
    menu: ["Ragù napoletano con ziti spezzati", "Braciole", "Frutta di stagione"],
    languagesSpoken: ["Italiano"],
    conversationTopics: [
      "La domenica napoletana",
      "Storie di famiglia intorno al ragù",
    ],
    houseRules:
      "Si resta a tavola almeno tre ore, come vuole la tradizione della domenica.",
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
      "https://assets.tmecosys.com/image/upload/t_web_rdp_recipe_584x480_1_5x/img/recipe/ras/Assets/A3DD74DB-884D-4DFD-A883-B5DB10AB02DB/Derivates/e4c0c1da-9001-4494-9739-9c8ed5359624.jpg",
    ],
    tags: ["dessert", "holiday", "neapolitan"],
    dietaryOptions: ["vegetariano"],
    menu: ["Struffoli", "Cioccolata calda"],
    languagesSpoken: ["Italiano", "un po' di inglese"],
    conversationTopics: ["Tradizioni natalizie napoletane", "Dolci delle feste"],
    houseRules:
      "Le mani appiccicose sono benvenute: si sporca, si ride, si mangia.",
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
      "https://assets.tmecosys.com/image/upload/t_web_rdp_recipe_584x480_1_5x/img/recipe/ras/Assets/6257438f-e33d-4174-ba10-512bfdc8c569/Derivates/8f5cd47a-e22c-4917-9234-e98c0a789d13.jpg",
    ],
    tags: ["street-food", "roman", "vegetarian"],
    dietaryOptions: ["vegetariano"],
    menu: ["Supplì al telefono", "Fiori di zucca fritti", "Birra artigianale romana"],
    languagesSpoken: ["Italiano", "English"],
    conversationTopics: ["Cibo di strada romano", "Mercati storici di Roma"],
    houseRules:
      "Si cucina in piedi, come in una vera friggitoria: spazio ristretto, divertimento assicurato.",
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
      "https://blog.giallozafferano.it/nocemoscata/wp-content/uploads/2019/05/IMG_4087..jpg",
    ],
    tags: ["pasta", "roman"],
    dietaryOptions: ["vegetariano"],
    menu: ["Tonnarelli cacio e pepe fatti a mano"],
    languagesSpoken: ["Italiano"],
    conversationTopics: ["L'arte della pasta fresca", "Vita di quartiere a Testaccio"],
    houseRules: "Farina ovunque: vestiti comodi consigliati.",
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
      "https://www.giallozafferano.it/images/232-23207/Pastiera-napoletana_450x300.jpg",
    ],
    tags: ["dessert", "easter", "baking", "neapolitan"],
    dietaryOptions: ["vegetariano"],
    menu: ["Pastiera napoletana", "Taralli dolci", "Spumante per il brindisi"],
    languagesSpoken: ["Italiano", "English"],
    conversationTopics: [
      "Tradizioni pasquali napoletane",
      "Ricordi di famiglia intorno alla pastiera",
    ],
    houseRules:
      "La pastiera riposa una notte: si assaggia il giorno dopo, pazienza è la regola della casa.",
  },
  // Past experiences (Task 41): status "completed" keeps them out of the
  // public catalog/host page (both filter status=published, with no
  // default date floor), while still backing a confirmed+paid past
  // booking so reviews are demoable.
  {
    key: "carmelaPast",
    hostKey: "carmela",
    title: "Sunday Cacio e Pepe with Nonna Carmela",
    recipeName: "Cacio e Pepe",
    story:
      "Una ricetta di soli tre ingredienti, ma che richiede una mano esperta. Carmela vi insegnerà il gesto giusto per la mantecatura perfetta.",
    daysFromNow: -10,
    durationMin: 150,
    price: 5500,
    seatsTotal: 6,
    seatsBooked: 1,
    address: "Via della Lungaretta 45, 00153 Roma",
    photos: ["https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800"],
    tags: ["pasta", "roman", "vegetarian"],
    dietaryOptions: ["vegetariano"],
    menu: ["Cacio e pepe", "Insalata di stagione", "Un bicchiere di vino bianco"],
    languagesSpoken: ["Italiano", "un po' di inglese"],
    conversationTopics: ["Ricette di famiglia", "Vita di quartiere a Trastevere"],
    houseRules:
      "Si mangia tutti insieme, niente telefoni a tavola. Togliersi le scarpe all'ingresso.",
    status: "completed",
  },
  {
    key: "assuntaPast",
    hostKey: "assunta",
    title: "Neapolitan Pizza Night",
    recipeName: "Pizza Napoletana",
    story:
      "Impasto a lunga lievitazione, pomodoro San Marzano e fior di latte. Assunta vi mostra come nasce una vera pizza napoletana, dal forno di casa sua.",
    daysFromNow: -18,
    durationMin: 210,
    price: 7000,
    seatsTotal: 8,
    seatsBooked: 1,
    address: "Via Toledo 112, 80134 Napoli",
    photos: ["https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=800"],
    tags: ["pizza", "neapolitan"],
    dietaryOptions: ["vegetariano"],
    menu: ["Pizza Margherita", "Pizza Marinara", "Babà al rum"],
    languagesSpoken: ["Italiano", "English"],
    conversationTopics: [
      "Segreti dell'impasto napoletano",
      "Quartieri Spagnoli e la vita di Napoli",
    ],
    houseRules: "Il forno è acceso da ore: attenzione al calore vicino alla cucina.",
    status: "completed",
  },
];

const bookingsData = [
  {
    key: "carmelaPastBooking",
    experienceKey: "carmelaPast",
    guestKey: "guest",
    seats: 1,
    message: "Non vedo l'ora di imparare la vera cacio e pepe!",
    status: "confirmed",
    paid: true,
  },
  {
    key: "assuntaPastBooking",
    experienceKey: "assuntaPast",
    guestKey: "guest",
    seats: 1,
    message: "Adoro la pizza napoletana, grazie per l'invito!",
    status: "confirmed",
    paid: true,
  },
];

// The second booking's hostToGuest direction is deliberately left
// unreviewed, so a live "leave a review" CTA and a real POST .../review
// call remain exercisable after seeding (manual testing + smoke test).
const reviewsData = [
  {
    bookingKey: "carmelaPastBooking",
    direction: "guestToHost",
    authorKey: "guest",
    targetHostKey: "carmela",
    rating: 5,
    text: "Esperienza bellissima, la cacio e pepe di Carmela è perfetta!",
  },
  {
    bookingKey: "carmelaPastBooking",
    direction: "hostToGuest",
    authorKey: "manager",
    targetUserKey: "guest",
    rating: 5,
    text: "Ospite fantastica, puntuale e curiosa di imparare.",
  },
  {
    bookingKey: "assuntaPastBooking",
    direction: "guestToHost",
    authorKey: "guest",
    targetHostKey: "assunta",
    rating: 4,
    text: "Pizza buonissima, serata molto piacevole.",
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
    Booking.deleteMany({}),
    Review.deleteMany({}),
  ]);
  console.log(
    "Cleared existing users, host profiles, experiences, bookings and reviews",
  );

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
    experiencesData.map(({ hostKey, daysFromNow, key, status, ...rest }) => ({
      ...rest,
      host: hostIdByKey[hostKey],
      date: new Date(Date.now() + daysFromNow * DAY_MS),
      status: status ?? "published",
    })),
  );
  const experienceIdByKey = Object.fromEntries(
    experiencesData
      .map((e, i) => [e.key, createdExperiences[i]._id])
      .filter(([key]) => key !== undefined),
  );
  console.log(`Created ${createdExperiences.length} experiences`);

  const createdBookings = await Booking.create(
    bookingsData.map(({ key, experienceKey, guestKey, ...rest }) => ({
      ...rest,
      experience: experienceIdByKey[experienceKey],
      guest: userIdByKey[guestKey],
    })),
  );
  const bookingIdByKey = Object.fromEntries(
    bookingsData.map((b, i) => [b.key, createdBookings[i]._id]),
  );
  console.log(`Created ${createdBookings.length} bookings`);

  await Review.create(
    reviewsData.map(
      ({ bookingKey, authorKey, targetHostKey, targetUserKey, ...rest }) => ({
        ...rest,
        booking: bookingIdByKey[bookingKey],
        author: userIdByKey[authorKey],
        ...(targetHostKey && { targetHost: hostIdByKey[targetHostKey] }),
        ...(targetUserKey && { targetUser: userIdByKey[targetUserKey] }),
      }),
    ),
  );
  await Review.recomputeHostRating(hostIdByKey.carmela);
  await Review.recomputeHostRating(hostIdByKey.assunta);
  console.log(`Created ${reviewsData.length} reviews`);

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
