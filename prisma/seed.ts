import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.assignment.findFirst({ where: { title: "Sum of two numbers" } });
  if (existing) {
    console.log("Demo assignment already exists:", existing.id);
    return;
  }
  const a = await prisma.assignment.create({
    data: {
      title: "Sum of two numbers",
      description: "Read two integers from stdin (space-separated) and print their sum.",
      language: "python",
      criteria: [
        "Reads input from stdin",
        "Computes the sum with a built-in arithmetic operator (no external libraries)",
        "Prints only the result",
      ],
      tests: [
        { stdin: "2 3", expectedStdout: "5" },
        { stdin: "10 20", expectedStdout: "30" },
        { stdin: "-4 4", expectedStdout: "0" },
      ],
    },
  });
  console.log("Seeded demo assignment:", a.id);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
