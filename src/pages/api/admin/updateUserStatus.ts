import { PrismaClient } from '@prisma/client';
import { NextApiRequest, NextApiResponse } from 'next';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId, status } = req.body;

  // Validate status input
  if (!['APPROVED', 'REJECTED'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { status },
    });
    res.status(200).json(updatedUser);
  } catch (e: any) {
    console.error(e.message);     // the validation hint you need
    console.dir(e.meta, { depth: null });
    res.status(500).json({ error: 'Failed to update user status' });
  }
}
