import { Injectable, NotFoundException } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PhotosService {
  constructor(private prisma: PrismaService) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  findAll() {
    return this.prisma.photo.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async upload(file: Express.Multer.File, caption?: string) {
    const result = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: 'nmdb-arder',
            transformation: [{ width: 1200, crop: 'limit', quality: 'auto:good' }],
          },
          (error, result) => (error ? reject(error) : resolve(result)),
        )
        .end(file.buffer);
    });

    return this.prisma.photo.create({
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        caption: caption || null,
      },
    });
  }

  async remove(id: string) {
    const photo = await this.prisma.photo.findUnique({ where: { id } });
    if (!photo) throw new NotFoundException('Photo introuvable.');

    await cloudinary.uploader.destroy(photo.publicId);
    await this.prisma.photo.delete({ where: { id } });
    return { success: true };
  }
}
