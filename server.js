const Hapi = require("@hapi/hapi");
const fs = require("fs");
const path = require("path");

// Fungsi untuk menghitung BMR
const calculateBMR = (gender, weight, height, age) => {
  if (!["male", "female"].includes(gender)) {
    throw new Error("Invalid gender. Please choose 'male' or 'female'.");
  }

  if (gender === "male") {
    return 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    return 10 * weight + 6.25 * height - 5 * age - 161;
  }
};

// Fungsi untuk menghitung kebutuhan kalori berdasarkan aktivitas
const calculateCalories = (bmr, activityLevel) => {
  const activityFactors = {
    sedentary: 1.2,
    lightly_active: 1.375,
    moderately_active: 1.55,
    very_active: 1.725,
    extra_active: 1.9,
  };

  if (!activityFactors[activityLevel]) {
    throw new Error(
      "Invalid activity level. Choose from: sedentary, lightly_active, moderately_active, very_active, or extra_active."
    );
  }

  return bmr * activityFactors[activityLevel];
};

// Fungsi untuk membaca data makanan dari file JSON
const loadFoodItems = () => {
  const filePath = path.join(__dirname, "foodItems.json");
  const data = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(data);
};

// Inisialisasi server HAPI
const init = async () => {
  const server = Hapi.server({
    port: 3000,
    host: "localhost",
  });

  server.route({
    method: "GET",
    path: "/",
    handler: (request, h) => {
      return h
        .response({
          message: "Welcome to FitJourney BackendAPI",
        })
        .code(200);
    },
  });

  // Route untuk API BMR dan rekomendasi makanan
  server.route({
    method: "POST",
    path: "/getRecomend",
    handler: (request, h) => {
      try {
        const { gender, weight, height, age, activity, dietObjective } =
          request.payload;

        // Validasi input
        if (
          !gender ||
          !weight ||
          !height ||
          !age ||
          !activity ||
          !dietObjective
        ) {
          return h
            .response({
              error:
                "All fields (gender, weight, height, age, activity, dietObjective) are required.",
            })
            .code(400);
        }

        // Hitung BMR
        const bmr = calculateBMR(gender, weight, height, age);

        // Hitung kebutuhan kalori harian
        const dailyCalories = calculateCalories(bmr, activity);

        // Ambil data makanan dari file JSON
        const foodItems = loadFoodItems();

        let recommendedFoods = foodItems;
        if (dietObjective === "weight_loss") {
          filteredFoods = foodItems.filter(
            (item) => item.calories < dailyCalories * 0.2
          );
        } else if (dietObjective === "muscle_gain") {
          filteredFoods = foodItems.filter(
            (item) =>
              item.calories >= dailyCalories * 0.15 &&
              item.calories <= dailyCalories * 0.4
          );
        } else if (dietObjective === "maintain") {
          filteredFoods = foodItems.filter(
            (item) =>
              item.calories >= dailyCalories * 0.1 &&
              item.calories <= dailyCalories * 0.3
          );
        }

        // Batasi hanya 10 makanan
        const limitedFoods = recommendedFoods.slice(0, 10);

        // Return response
        return h
          .response({
            dailyCalories: Math.round(dailyCalories),
            recommendedFoods: limitedFoods,
          })
          .code(200);
      } catch (error) {
        return h.response({ error: error.message }).code(400);
      }
    },
  });

  await server.start();
  console.log("Server running on %s", server.info.uri);
};

// Jalankan server
process.on("unhandledRejection", (err) => {
  console.log(err);
  process.exit(1);
});

init();
