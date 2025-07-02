import express from "express";
import Checklist, { IChecklist } from "../models/Checklist";
import ItemChecklist from "../models/Item";
import { AuthRequest } from "../middleware/auth";
import { authenticateToken } from "../middleware/auth";
const router = express.Router();

router.get(
  "/",
  authenticateToken,
  async (req: AuthRequest, res: express.Response) => {
    try {
      const checklists = await Checklist.find().populate("items.itemChecklist");

      res.status(200).json({
        statusCode: 200,
        message: "Proses view all berhasil",
        errorMessage: null,
        data: checklists,
      });
    } catch (error) {
      res.status(500).json({
        statusCode: 500,
        message: "Error fetching checklists",
        errorMessage: error,
        data: null,
      });
    }
  }
);

router.post(
  "/",
  authenticateToken,
  async (req: AuthRequest, res: express.Response) => {
    try {
      const { name, items } = req.body;

      if (!name) {
        res.status(400).json({
          message: "Field 'name' harus diisi",
          error: "ValidationError",
        });
      }

      const checklist = new Checklist({
        name,
        items: items || [], 
      });

      await checklist.save();

      const populatedChecklist = await Checklist.findById(
        checklist._id
      ).populate("items.itemChecklist");

      res.status(201).json({
        statusCode: 201,
        message: "Checklist berhasil dibuat",
        errorMessage: null,
        data: populatedChecklist,
      });
    } catch (error) {
      res.status(500).json({
        statusCode: 500,
        message: "Terjadi kesalahan saat menyimpan checklist",
        errorMessage: error,
        data: null,
      });
    }
  }
);

router.delete(
  "/:id",
  authenticateToken,
  async (req: AuthRequest, res: express.Response) => {
    try {
      const { id } = req.params;

      const checklist = await Checklist.findByIdAndDelete(id);

      if (!checklist) {
        res.status(404).json({
          statusCode: 404,
          message: "Checklist tidak ditemukan",
          errorMessage: null,
          data: null,
        });
      }

      res.status(200).json({
        statusCode: 200,
        message: "Checklist berhasil dihapus",
        errorMessage: null,
        data: checklist,
      });
    } catch (error) {
      res.status(500).json({
        statusCode: 500,
        message: "Terjadi kesalahan saat menghapus checklist",
        errorMessage: error,
        data: null,
      });
    }
  }
);

router.get(
  "/:checklistId/item",
  authenticateToken,
  async (req: AuthRequest, res: express.Response) => {
    try {
      const { checklistId } = req.params;

      const checklist = await Checklist.findById(checklistId).populate(
        "items.itemChecklist"
      );

      if (!checklist) {
        res.status(404).json({
          statusCode: 404,
          message: "Checklist tidak ditemukan",
          errorMessage: null,
          data: null,
        });
        return;
      }

      const items = checklist.items.map((item: any) => {
        const checklistItem = item.itemChecklist?.toObject?.() ?? {};
        return {
          _id: checklistItem._id,
          title: checklistItem.title,
          completionStatus: item.completionStatus,
        };
      });

      res.status(200).json({
        statusCode: 200,
        message: "Berhasil mengambil item checklist",
        errorMessage: null,
        data: items,
      });
    } catch (error) {
      res.status(500).json({
        statusCode: 500,
        message: "Terjadi kesalahan saat mengambil item checklist",
        errorMessage: error,
        data: null,
      });
    }
  }
);

router.post(
  "/:checklistId/item",
  authenticateToken,
  async (req: AuthRequest, res: express.Response) => {
    try {
      const { checklistId } = req.params;
      const { name } = req.body;

      if (!name || name.trim() === "") {
        res.status(400).json({
          statusCode: 400,
          message: "Field 'name' wajib diisi",
          errorMessage: null,
          data: null,
        });
        return;
      }

      const newItem = new ItemChecklist({ title: name });
      await newItem.save();

      const checklist = await Checklist.findById(checklistId);

      if (!checklist) {
        res.status(404).json({
          statusCode: 404,
          message: "Checklist tidak ditemukan",
          errorMessage: null,
          data: null,
        });
        return;
      }

      if (!checklist.items) {
        checklist.items = [];
      }

      checklist.items.push({
        itemChecklist: newItem._id as import("mongoose").Types.ObjectId,
        completionStatus: false,
      });

      await checklist.save();

      const updatedChecklist = await Checklist.findById(checklistId).populate(
        "items.itemChecklist"
      );

      if (!updatedChecklist) {
        res.status(500).json({
          statusCode: 500,
          message:
            "Checklist berhasil disimpan tapi gagal mengambil data terbaru",
          errorMessage: null,
          data: null,
        });
        return;
      }

      const flattenedItems = updatedChecklist.items.map((item: any) => {
        const itemChecklistData =
          typeof item.itemChecklist === "object" &&
          item.itemChecklist !== null &&
          "toObject" in item.itemChecklist
            ? (item.itemChecklist as any).toObject()
            : item.itemChecklist || {};
        return {
          _id: itemChecklistData._id,
          title: itemChecklistData.title,
          completionStatus: item.completionStatus,
        };
      });

      res.status(200).json({
        statusCode: 200,
        message: "Item checklist berhasil ditambahkan dan dikaitkan",
        errorMessage: null,
        data: flattenedItems,
      });
    } catch (error) {
      res.status(500).json({
        statusCode: 500,
        message: "Gagal menambahkan item checklist",
        errorMessage: error,
        data: null,
      });
    }
  }
);

router.get(
  "/:checklistId/item/:id",
  authenticateToken,
  async (req: AuthRequest, res: express.Response) => {
    try {
      const { checklistId, id: itemId } = req.params;

      const checklist = await Checklist.findById(checklistId).populate(
        "items.itemChecklist"
      );

      if (!checklist) {
        res.status(404).json({
          statusCode: 404,
          message: "Checklist tidak ditemukan",
          errorMessage: null,
          data: null,
        });
        return;
      }

      const item = checklist.items.find(
        (i: any) => i.itemChecklist?._id?.toString() === itemId
      );

      if (!item) {
        res.status(404).json({
          statusCode: 404,
          message: "Item checklist tidak ditemukan dalam checklist ini",
          errorMessage: null,
          data: null,
        });
        return;
      }

      const itemChecklistData =
        typeof item.itemChecklist === "object" &&
        item.itemChecklist !== null &&
        "toObject" in item.itemChecklist
          ? (item.itemChecklist as any).toObject()
          : item.itemChecklist || {};

      res.status(200).json({
        statusCode: 200,
        message: "Berhasil mengambil item checklist",
        errorMessage: null,
        data: {
          _id: itemChecklistData._id,
          title: itemChecklistData.title,
          completionStatus: item.completionStatus,
        },
      });
    } catch (error) {
      res.status(500).json({
        statusCode: 500,
        message: "Terjadi kesalahan saat mengambil item checklist",
        errorMessage: error,
        data: null,
      });
    }
  }
);
router.patch(
  "/:checklistId/item/:id",
  authenticateToken,
  async (req: AuthRequest, res: express.Response) => {
    try {
      const { checklistId, id: itemId } = req.params;
      const { completionStatus } = req.body;

      if (typeof completionStatus !== "boolean") {
        res.status(400).json({
          statusCode: 400,
          message: "Field 'completionStatus' harus berupa boolean",
          errorMessage: null,
          data: null,
        });
        return;
      }

      const checklist = await Checklist.findById(checklistId).populate(
        "items.itemChecklist"
      );

      if (!checklist) {
        res.status(404).json({
          statusCode: 404,
          message: "Checklist tidak ditemukan",
          errorMessage: null,
          data: null,
        });
        return;
      }

      const item = checklist.items.find(
        (i: any) => i.itemChecklist?._id?.toString() === itemId
      );

      if (!item) {
        res.status(404).json({
          statusCode: 404,
          message: "Item checklist tidak ditemukan dalam checklist ini",
          errorMessage: null,
          data: null,
        });
        return;
      }

      item.completionStatus = completionStatus;
      await checklist.save();

      const itemChecklistData =
        typeof item.itemChecklist === "object" &&
        item.itemChecklist !== null &&
        "toObject" in item.itemChecklist
          ? (item.itemChecklist as any).toObject()
          : item.itemChecklist || {};

      res.status(200).json({
        statusCode: 200,
        message: "Status item checklist berhasil diperbarui",
        errorMessage: null,
        data: {
          _id: itemChecklistData._id,
          title: itemChecklistData.title,
          completionStatus: item.completionStatus,
        },
      });
    } catch (error) {
      res.status(500).json({
        statusCode: 500,
        message: "Gagal memperbarui status item checklist",
        errorMessage: error,
        data: null,
      });
    }
  }
);
router.delete(
  "/:checklistId/item/:id",
  authenticateToken,
  async (req: AuthRequest, res: express.Response) => {
    try {
      const { checklistId, id: itemId } = req.params;

      const checklist = await Checklist.findById(checklistId);

      if (!checklist) {
        res.status(404).json({
          statusCode: 404,
          message: "Checklist tidak ditemukan",
          errorMessage: null,
          data: null,
        });
        return;
      }

      const index = checklist.items.findIndex(
        (item: any) => item.itemChecklist?.toString() === itemId
      );

      if (index === -1) {
        res.status(404).json({
          statusCode: 404,
          message: "Item tidak ditemukan dalam checklist ini",
          errorMessage: null,
          data: null,
        });
        return;
      }

      const deletedItemId = checklist.items[index].itemChecklist;

      checklist.items.splice(index, 1);
      await checklist.save();

      await ItemChecklist.findByIdAndDelete(deletedItemId);

      res.status(200).json({
        statusCode: 200,
        message: "Item checklist berhasil dihapus",
        errorMessage: null,
        data: {
          _id: deletedItemId,
        },
      });
    } catch (error) {
      res.status(500).json({
        statusCode: 500,
        message: "Gagal menghapus item checklist",
        errorMessage: error,
        data: null,
      });
    }
  }
);
router.patch(
  "/:checklistId/item/rename/:id",
  authenticateToken,
  async (req: AuthRequest, res: express.Response) => {
    try {
      const { checklistId, id: itemId } = req.params;
      const { title } = req.body;

      if (!title || typeof title !== "string" || title.trim() === "") {
        res.status(400).json({
          statusCode: 400,
          message: "Field 'title' wajib diisi dan berupa string",
          errorMessage: null,
          data: null,
        });
        return;
      }
      const checklist = await Checklist.findById(checklistId);

      if (!checklist) {
        res.status(404).json({
          statusCode: 404,
          message: "Checklist tidak ditemukan",
          errorMessage: null,
          data: null,
        });
        return;
      }

      const itemInChecklist = checklist.items.find(
        (item: any) => item.itemChecklist?.toString() === itemId
      );

      if (!itemInChecklist) {
        res.status(404).json({
          statusCode: 404,
          message: "Item checklist tidak ditemukan dalam checklist ini",
          errorMessage: null,
          data: null,
        });
        return;
      }

      const itemChecklist = await ItemChecklist.findById(itemId);
      if (!itemChecklist) {
        res.status(404).json({
          statusCode: 404,
          message: "Item checklist tidak ditemukan di database",
          errorMessage: null,
          data: null,
        });
        return;
      }

      itemChecklist.title = title;
      await itemChecklist.save();

      res.status(200).json({
        statusCode: 200,
        message: "Judul item checklist berhasil diperbarui",
        errorMessage: null,
        data: {
          _id: itemChecklist._id,
          title: itemChecklist.title,
        },
      });
    } catch (error) {
      res.status(500).json({
        statusCode: 500,
        message: "Gagal mengubah judul item checklist",
        errorMessage: error,
        data: null,
      });
    }
  }
);
export default router;
