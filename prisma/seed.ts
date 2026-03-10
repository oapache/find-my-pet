import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create plans
  const plans = [
    {
      slug: "free",
      namePt: "Gratuito",
      nameEn: "Free",
      priceBrl: null,
      priceUsd: null,
      billingCycle: "monthly",
      features: {
        maxPets: 1,
        maxPhotosPerPet: 3,
        customQr: false,
        posterTemplates: 1,
        customProfile: false,
        scanAnalytics: false,
        prioritySupport: false,
      },
      maxPets: 1,
      maxPhotosPerPet: 3,
      customQr: false,
      posterTemplates: 1,
      sortOrder: 0,
    },
    {
      slug: "premium",
      namePt: "Premium",
      nameEn: "Premium",
      priceBrl: 14.9,
      priceUsd: 4.9,
      billingCycle: "monthly",
      features: {
        maxPets: 5,
        maxPhotosPerPet: 10,
        customQr: true,
        posterTemplates: 5,
        customProfile: true,
        scanAnalytics: true,
        prioritySupport: false,
      },
      maxPets: 5,
      maxPhotosPerPet: 10,
      customQr: true,
      posterTemplates: 5,
      sortOrder: 1,
    },
    {
      slug: "pro",
      namePt: "Pro",
      nameEn: "Pro",
      priceBrl: 29.9,
      priceUsd: 9.9,
      billingCycle: "monthly",
      features: {
        maxPets: 999,
        maxPhotosPerPet: 999,
        customQr: true,
        posterTemplates: 999,
        customProfile: true,
        scanAnalytics: true,
        prioritySupport: true,
      },
      maxPets: 999,
      maxPhotosPerPet: 999,
      customQr: true,
      posterTemplates: 999,
      sortOrder: 2,
    },
  ];

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { slug: plan.slug },
      update: plan,
      create: plan,
    });
    console.log(`  ✅ Plan: ${plan.slug}`);
  }

  console.log("✨ Seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
