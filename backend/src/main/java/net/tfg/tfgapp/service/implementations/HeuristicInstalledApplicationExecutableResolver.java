package net.tfg.tfgapp.service.implementations;



import net.tfg.tfgapp.DTOs.apprestrict.InstalledApplicationRegistryEntry;
import net.tfg.tfgapp.DTOs.apprestrict.ResolvedExecutableDTO;
import net.tfg.tfgapp.service.interfaces.InstalledApplicationExecutableResolver;
import org.springframework.stereotype.Service;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Comparator;
import java.util.Set;
import java.util.stream.Stream;

@Service
public class HeuristicInstalledApplicationExecutableResolver implements InstalledApplicationExecutableResolver {

    private static final Set<String> EXCLUDED_EXECUTABLE_NAMES = Set.of(
            "uninstall.exe",
            "unins000.exe",
            "unins001.exe",
            "setup.exe",
            "update.exe",
            "updater.exe",
            "crashhandler.exe",
            "crashpad_handler.exe",
            "helper.exe",
            "repair.exe"
    );

    @Override
    public ResolvedExecutableDTO resolveExecutable(InstalledApplicationRegistryEntry application) {
        String executableFromIcon = extractExecutablePathFromDisplayIcon(application.getDisplayIcon());

        if (isUsableExecutable(executableFromIcon)) {
            File executableFile = new File(executableFromIcon);
            return new ResolvedExecutableDTO(
                    executableFile.getName().toLowerCase(),
                    executableFile.getAbsolutePath(),
                    true
            );
        }

        String resolvedFromInstallLocation = resolveFromInstallLocation(
                application.getInstallLocation(),
                application.getDisplayName()
        );

        if (isUsableExecutable(resolvedFromInstallLocation)) {
            File executableFile = new File(resolvedFromInstallLocation);
            return new ResolvedExecutableDTO(
                    executableFile.getName().toLowerCase(),
                    executableFile.getAbsolutePath(),
                    true
            );
        }

        return new ResolvedExecutableDTO(null, null, false);
    }

    /**
     * Intenta extraer una ruta ejecutable real a partir del campo DisplayIcon del registro.
     * Muchas entradas incluyen el exe seguido de una coma y un índice de recurso.
     *
     * @param displayIcon valor raw del registro.
     * @return ruta del exe si parece válida, null en caso contrario.
     */
    private String extractExecutablePathFromDisplayIcon(String displayIcon) {
        if (displayIcon == null || displayIcon.isBlank()) {
            return null;
        }

        String cleaned = displayIcon.trim();

        if (cleaned.startsWith("\"")) {
            int closingQuoteIndex = cleaned.indexOf("\"", 1);
            if (closingQuoteIndex > 1) {
                cleaned = cleaned.substring(1, closingQuoteIndex);
            }
        } else {
            int commaIndex = cleaned.indexOf(",");
            if (commaIndex > 0) {
                cleaned = cleaned.substring(0, commaIndex);
            }
        }

        cleaned = cleaned.trim();

        if (!cleaned.toLowerCase().endsWith(".exe")) {
            return null;
        }

        return cleaned;
    }

    /**
     * Busca un ejecutable razonable dentro de la carpeta de instalación.
     * Se recorren niveles superficiales para evitar coste innecesario y se puntúan los candidatos.
     *
     * @param installLocation carpeta de instalación.
     * @param displayName nombre visible de la aplicación.
     * @return ruta del ejecutable mejor puntuado o null.
     */
    private String resolveFromInstallLocation(String installLocation, String displayName) {
        if (installLocation == null || installLocation.isBlank()) {
            return null;
        }

        File installDir = new File(installLocation);
        if (!installDir.exists() || !installDir.isDirectory()) {
            return null;
        }

        try (Stream<Path> pathStream = Files.walk(installDir.toPath(), 2)) {
            return pathStream
                    .filter(Files::isRegularFile)
                    .map(Path::toFile)
                    .filter(file -> file.getName().toLowerCase().endsWith(".exe"))
                    .filter(file -> !isExcludedExecutable(file.getName()))
                    .max(Comparator.comparingInt(file -> scoreExecutableCandidate(file, displayName, installDir)))
                    .map(File::getAbsolutePath)
                    .orElse(null);
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * Determina si el ejecutable encontrado es utilizable para bloqueo.
     *
     * @param executablePath ruta candidata.
     * @return true si existe, es fichero y no es un ejecutable descartado.
     */
    private boolean isUsableExecutable(String executablePath) {
        if (executablePath == null || executablePath.isBlank()) {
            return false;
        }

        File file = new File(executablePath);
        return file.exists()
                && file.isFile()
                && file.getName().toLowerCase().endsWith(".exe")
                && !isExcludedExecutable(file.getName());
    }

    /**
     * Puntúa un ejecutable candidato según su parecido con el nombre visible
     * y su proximidad a la raíz de instalación.
     *
     * @param file ejecutable candidato.
     * @param displayName nombre visible de la aplicación.
     * @param installDir carpeta raíz de instalación.
     * @return puntuación del candidato.
     */
    private int scoreExecutableCandidate(File file, String displayName, File installDir) {
        int score = 0;

        String executableBaseName = normalize(file.getName().replace(".exe", ""));
        String normalizedDisplayName = normalize(displayName);

        if (executableBaseName.equals(normalizedDisplayName)) {
            score += 100;
        }

        if (executableBaseName.contains(normalizedDisplayName) || normalizedDisplayName.contains(executableBaseName)) {
            score += 60;
        }

        if (file.getParentFile() != null && file.getParentFile().equals(installDir)) {
            score += 15;
        }

        long size = file.length();
        if (size > 0) {
            score += Math.min((int) (size / (1024 * 1024)), 20);
        }

        return score;
    }

    /**
     * Indica si un ejecutable corresponde a un binario auxiliar que no debería usarse como principal.
     *
     * @param fileName nombre del fichero.
     * @return true si debe excluirse.
     */
    private boolean isExcludedExecutable(String fileName) {
        return EXCLUDED_EXECUTABLE_NAMES.contains(fileName.toLowerCase());
    }

    /**
     * Normaliza un texto para comparaciones heurísticas.
     *
     * @param value texto de entrada.
     * @return texto en minúsculas, sin espacios, guiones ni guiones bajos.
     */
    private String normalize(String value) {
        if (value == null) {
            return "";
        }

        return value.toLowerCase()
                .replace(" ", "")
                .replace("-", "")
                .replace("_", "");
    }
}
