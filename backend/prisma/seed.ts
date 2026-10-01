import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

// Идемпотентный upsert админа — безопасно запускать на каждый старт контейнера.
const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error('ADMIN_EMAIL и ADMIN_PASSWORD должны быть заданы');
  }

  const hash = await bcrypt.hash(password, 10);
  await prisma.user.upsert({
    where: { email },
    update: { role: Role.ADMIN, password: hash },
    create: { email, password: hash, fullName: 'Администратор', role: Role.ADMIN },
  });
  console.log(`Seed: администратор ${email} готов`);
}

try {
  await main();
} finally {
  await prisma.$disconnect();
}
