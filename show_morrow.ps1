Add-Type @"
using System;
using System.Runtime.InteropServices;
public class Window {
    [DllImport("user32.dll")]
    [return: MarshalAs(UnmanagedType.Bool)]
    public static extern bool SetForegroundWindow(IntPtr hWnd);
    
    [DllImport("user32.dll", SetLastError = true)]
    public static extern IntPtr FindWindow(string lpClassName, string lpWindowName);
}
"@
$hwnd = [Window]::FindWindow($null, "Morrow Browser")
if ($hwnd -ne [IntPtr]::Zero) {
    [Window]::SetForegroundWindow($hwnd)
    Write-Host "Morrow Browser window found and focused."
} else {
    Write-Host "Morrow Browser window not found."
}
