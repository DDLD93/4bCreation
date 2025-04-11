const CertificateModel = require("../model/certificate.model");

class CertificateController {
  constructor() {
  }

  async createCertificate(body) {
    try {
      const newCertificate = new CertificateModel(body);
      await newCertificate.save();
      return {
        ok: true,
        data: newCertificate,
        message: "Certificate created successfully",
      };
    } catch (error) {
      console.log("Error creating certificate:", error.message);
      // Add specific error handling if needed (e.g., validation errors)
      return { ok: false, message: error.message };
    }
  }

  async getCertificates(filter = {}, options = {}) {
    try {
      const page = parseInt(options.page) || 1;
      const limit = parseInt(options.limit) || 50;
      const skip = (page - 1) * limit;
      const sort = options.sort || { createdAt: -1 }; // Default sort

      const total = await CertificateModel.countDocuments(filter);
      const certificates = await CertificateModel.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit);

      const totalPages = Math.ceil(total / limit);
      const hasNext = page < totalPages;
      const hasPrev = page > 1;

      return {
        ok: true,
        data: certificates,
        pagination: {
          total,
          totalPages,
          currentPage: page,
          limit,
          hasNext,
          hasPrev
        },
        message: `Found ${certificates.length} certificates (page ${page} of ${totalPages})`
      };
    } catch (error) {
      console.log("Error fetching certificates:", error.message);
      return { ok: false, message: error.message };
    }
  }

  async getCertificateById(id) {
    try {
      const certificate = await CertificateModel.findById(id);
      if (!certificate) {
        return { ok: false, message: "Certificate not found" };
      }
      return { ok: true, data: certificate, message: "Certificate retrieved successfully" };
    } catch (error) {
      console.log("Error retrieving certificate:", error.message);
      return { ok: false, message: error.message };
    }
  }

  async updateCertificate(id, newData) {
    try {
      const updatedCertificate = await CertificateModel.findByIdAndUpdate(id, newData, { new: true });
      return { ok: true, data: updatedCertificate, message: updatedCertificate ? "Certificate updated successfully" : "Certificate not found" };
    } catch (error) {
      console.log("Error updating certificate:", error.message);
      return { ok: false, message: error.message };
    }
  }

  async deleteCertificate(id) {
    try {
      const deletedCertificate = await CertificateModel.findByIdAndDelete(id);
      return { ok: true, data: deletedCertificate, message: deletedCertificate ? "Certificate deleted successfully" : "Certificate not found" };
    } catch (error) {
      console.log("Error deleting certificate:", error.message);
      return { ok: false, message: error.message };
    }
  }

  // Add other certificate-specific methods if needed
}

module.exports = new CertificateController(); 