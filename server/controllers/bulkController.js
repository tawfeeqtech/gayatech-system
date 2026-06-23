const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * دوال عامة للحذف والتعديل الجماعي
 * تستقبل مصفوفة ids وتنفذ العملية على كل عنصر
 */
const bulkController = {
  /**
   * حذف جماعي
   * POST /api/:resource/bulk-delete
   * body: { ids: ["id1", "id2", ...] }
   */
  bulkDelete: (Model, options = {}) => asyncHandler(async (req, res, next) => {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return next(new ApiError('يرجى توفير مصفوفة من المعرفات للحذف', 400));
    }

    // التحقق المسبق إذا كان هناك خيار قبل الحذف
    if (options.beforeDelete) {
      const result = await options.beforeDelete(ids, req);
      if (result && result.error) {
        return next(new ApiError(result.error, 400));
      }
    }

    const result = await Model.deleteMany({ _id: { $in: ids } });

    res.status(200).json({
      status: 'success',
      message: `تم حذف ${result.deletedCount} عنصر بنجاح`,
      data: { deletedCount: result.deletedCount }
    });
  }),

  /**
   * تعديل جماعي
   * POST /api/:resource/bulk-update
   * body: { ids: ["id1", "id2", ...], field: "status", value: "مدفوعة" }
   */
  bulkUpdate: (Model, options = {}) => asyncHandler(async (req, res, next) => {
    const { ids, field, value } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return next(new ApiError('يرجى توفير مصفوفة من المعرفات', 400));
    }
    if (!field || value === undefined || value === null) {
      return next(new ApiError('يرجى توفير اسم الحقل والقيمة الجديدة', 400));
    }

    // التحقق من أن الحقل مسموح بتعديله
    if (options.allowedFields && !options.allowedFields.includes(field)) {
      return next(new ApiError(`لا يمكن تعديل الحقل "${field}"`, 400));
    }

    // تنفيذ التعديل
    const result = await Model.updateMany(
      { _id: { $in: ids } },
      { $set: { [field]: value } }
    );

    res.status(200).json({
      status: 'success',
      message: `تم تحديث ${result.modifiedCount} عنصر بنجاح`,
      data: { modifiedCount: result.modifiedCount }
    });
  }),
};

module.exports = bulkController;
