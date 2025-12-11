package net.tfg.tfgapp.utils;

import com.sun.jna.platform.win32.*;
import org.springframework.stereotype.Component;

import java.awt.*;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.List;

@Component
public class WindowsUtils {

    // Obtener lista de procesos
    public static List<String> getRunningProcesses() {
        List<String> processes = new ArrayList<>();
        try {
            Process process = Runtime.getRuntime().exec("tasklist.exe /fo csv /nh");
            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(process.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    if (!line.trim().isEmpty()) {
                        String processName = line.split("\"")[1];
                        processes.add(processName.toLowerCase());
                    }
                }
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
        return processes;
    }

    // Terminar proceso
    public static boolean killProcess(String processName) {
        try {
            Process process = Runtime.getRuntime().exec(
                    "tasklist /fi \"imagename eq " + processName + "\" /fo csv /nh");

            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
            String line;
            List<Integer> pids = new ArrayList<>();

            while ((line = reader.readLine()) != null) {
                if (!line.trim().isEmpty()) {
                    // Cada línea está entre comillas y separada por comas
                    String[] columns = line.split("\",\"");
                    if (columns.length >= 2) {
                        // El segundo campo es el PID, quita comillas si hace falta
                        String pidStr = columns[1].replace("\"", "").trim();
                        try {
                            pids.add(Integer.parseInt(pidStr));
                        } catch (NumberFormatException e) {
                            System.err.println("PID inválido para línea: " + line);
                        }
                    }
                }
            }

            boolean success = true;
            for (int pid : pids) {
                Process kill = Runtime.getRuntime().exec("taskkill /pid " + pid + " /f");
                kill.waitFor();
                if (kill.exitValue() != 0) {
                    success = false;
                }
            }

            return success && !pids.isEmpty();
        } catch (IOException | InterruptedException e) {
            e.printStackTrace();
            return false;
        }

    }

    // Verificar si aplicación está en fullscreen
    public static boolean isAppFullscreen() {
        WinDef.HWND hwnd = User32.INSTANCE.GetForegroundWindow();
        if (hwnd == null) return false;

        WinDef.RECT windowRect = new WinDef.RECT();
        User32.INSTANCE.GetWindowRect(hwnd, windowRect);

        Dimension screenSize = Toolkit.getDefaultToolkit().getScreenSize();
        return windowRect.right - windowRect.left >= screenSize.width &&
                windowRect.bottom - windowRect.top >= screenSize.height;
    }

    // Obtener título de ventana activa
    public static String getActiveWindowTitle() {
        char[] buffer = new char[1024];
        WinDef.HWND hwnd = User32.INSTANCE.GetForegroundWindow();
        User32.INSTANCE.GetWindowText(hwnd, buffer, buffer.length);
        return new String(buffer).trim();
    }

    // Apagar el sistema
    public static void shutdownSystem() {
        try {
            Runtime.getRuntime().exec("shutdown -s -t 0");
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
