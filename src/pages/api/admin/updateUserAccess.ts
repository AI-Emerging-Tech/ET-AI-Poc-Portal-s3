import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();
  const { id, role, accessLevel, accessStartTime, accessEndTime, pageAccess } = req.body;
  try {
    // Only update fields that are present and allowed
    const updateData: any = {};
    if (typeof role !== "undefined") updateData.role = role;
    if (typeof accessLevel !== "undefined") updateData.accessLevel = accessLevel;
    if (typeof accessStartTime !== "undefined" && accessStartTime !== '')
      updateData.accessStartTime = new Date(`1970-01-01T${accessStartTime}:00.000Z`)
    if (typeof accessEndTime !== "undefined" && accessEndTime !== '')
      updateData.accessEndTime = new Date(`1970-01-01T${accessEndTime}:00.000Z`)

    if (updateData.accessStartTime && updateData.accessEndTime) {
      if (updateData.accessStartTime > updateData.accessEndTime) {
        // + 1 day to accessEndTime
        updateData.accessEndTime = new Date(updateData.accessEndTime.getTime() + 24 * 60 * 60 * 1000);
      }
    }
    if (typeof pageAccess !== "undefined") updateData.pageAccess = pageAccess;
    await prisma.user.update({
      where: { id },
      data: {
        ...updateData
      },
    });
    res.status(200).json({ ok: true });
  } catch (e:any) {
    // console.error(JSON.stringify(e));
    // console.error(e);             // shows message + stack
    console.error(e.message);     // the validation hint you need
    console.dir(e.meta, { depth: null });
    res.status(500).json({ error: "Failed to update user" });
  }
}
