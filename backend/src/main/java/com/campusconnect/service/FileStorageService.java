package com.campusconnect.service;

import com.campusconnect.exception.ApiException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Pattern;

/** Stores event posters on local disk. Swap for Cloudinary/S3 later without touching controllers. */
@Service
public class FileStorageService {

    private static final Map<String, String> EXTENSIONS = Map.of(
            "image/png", "png", "image/jpeg", "jpg", "image/webp", "webp", "image/gif", "gif");
    private static final Pattern SAFE_NAME = Pattern.compile("[A-Za-z0-9._-]+");

    private final Path posterDir;

    public FileStorageService(@Value("${app.storage.dir:./uploads}") String storageDir) {
        this.posterDir = Paths.get(storageDir, "posters").toAbsolutePath().normalize();
    }

    public String savePoster(MultipartFile file) {
        String ext = EXTENSIONS.get(file.getContentType());
        if (file.isEmpty() || ext == null) {
            throw ApiException.badRequest("Upload a PNG, JPG, WEBP or GIF image");
        }
        String name = UUID.randomUUID() + "." + ext;
        try {
            Files.createDirectories(posterDir);
            Files.copy(file.getInputStream(), posterDir.resolve(name), StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException ex) {
            throw new UncheckedIOException(ex);
        }
        return "/api/files/posters/" + name;
    }

    public Resource loadPoster(String name) {
        if (!SAFE_NAME.matcher(name).matches()) throw ApiException.notFound("Poster");
        Path path = posterDir.resolve(name).normalize();
        if (!path.startsWith(posterDir) || !Files.exists(path)) throw ApiException.notFound("Poster");
        return new FileSystemResource(path);
    }
}
