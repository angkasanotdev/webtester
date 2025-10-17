<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Buat Panel PLTA - AngkasaDev</title>
<style>
body {
  font-family: 'Poppins', sans-serif;
  background: #0b0f19;
  color: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;
  margin: 0;
}
.container {
  margin-top: 60px;
  background: rgba(255,255,255,0.05);
  padding: 30px;
  border-radius: 15px;
  width: 90%;
  max-width: 450px;
  box-shadow: 0 0 25px rgba(0,0,0,0.5);
}
h1 {
  text-align: center;
  margin-bottom: 20px;
  color: #00bfff;
}
form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
input {
  padding: 10px;
  border-radius: 8px;
  border: none;
  outline: none;
  background: rgba(255,255,255,0.1);
  color: #fff;
}
button {
  background: #00bfff;
  border: none;
  padding: 12px;
  border-radius: 8px;
  color: #fff;
  cursor: pointer;
  transition: 0.3s;
}
button:hover {
  background: #0099cc;
}
pre {
  background: rgba(0,0,0,0.3);
  padding: 10px;
  border-radius: 8px;
  overflow-x: auto;
  margin-top: 15px;
  white-space: pre-wrap;
}
footer {
  text-align: center;
  margin-top: 40px;
  opacity: 0.7;
}
</style>
</head>
<body>
<div class="container">
  <h1>Buat Panel Otomatis</h1>
  <form id="panelForm" method="POST">
    <input type="text" name="username" placeholder="Username" required>
    <input type="email" name="email" placeholder="Email" required>
    <input type="password" name="password" placeholder="Password" required>
    <button type="submit" name="create">Buat Panel</button>
  </form>
  <pre id="log">
<?php
if (isset($_POST['create'])) {
    $apiKey = "ptla_IRpyYZMWIO8waq6SSvFjIw34GZAYVm2iY7kjdh7kNtH";
    $domain = "https://angkasadev.aissoffc.my.id";
    $egg = 15;
    $loc = 1;

    $username = $_POST['username'];
    $email = $_POST['email'];
    $password = $_POST['password'];

    echo "🔹 Membuat user...\n";
    flush();

    $payloadUser = [
        "email" => $email,
        "username" => $username,
        "first_name" => $username,
        "last_name" => "User",
        "language" => "en",
        "password" => $password
    ];

    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => "$domain/api/application/users",
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($payloadUser),
        CURLOPT_HTTPHEADER => [
            "Authorization: Bearer $apiKey",
            "Content-Type: application/json",
            "Accept: Application/vnd.pterodactyl.v1+json"
        ]
    ]);
    $response = curl_exec($ch);
    curl_close($ch);
    $userData = json_decode($response, true);

    if (isset($userData["errors"])) {
        echo "❌ Gagal membuat user: " . $userData["errors"][0]["detail"] . "\n";
        exit;
    }

    $userId = $userData["attributes"]["id"];
    echo "✅ User berhasil dibuat! ID: $userId\n";

    echo "🔹 Membuat server...\n";
    flush();

    $payloadServer = [
        "name" => $username . "Server",
        "user" => $userId,
        "egg" => $egg,
        "docker_image" => "ghcr.io/parkervcp/yolks:nodejs_20",
        "startup" => "npm start",
        "environment" => [
            "INST" => "npm",
            "CMD_RUN" => "npm start"
        ],
        "limits" => [
            "memory" => 1000,
            "swap" => 0,
            "disk" => 1000,
            "io" => 500,
            "cpu" => 40
        ],
        "feature_limits" => [
            "databases" => 1,
            "backups" => 1,
            "allocations" => 1
        ],
        "deploy" => [
            "locations" => [$loc],
            "dedicated_ip" => false,
            "port_range" => []
        ]
    ];

    $ch2 = curl_init();
    curl_setopt_array($ch2, [
        CURLOPT_URL => "$domain/api/application/servers",
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($payloadServer),
        CURLOPT_HTTPHEADER => [
            "Authorization: Bearer $apiKey",
            "Content-Type: application/json",
            "Accept: Application/vnd.pterodactyl.v1+json"
        ]
    ]);
    $response2 = curl_exec($ch2);
    curl_close($ch2);
    $serverData = json_decode($response2, true);

    if (isset($serverData["errors"])) {
        echo "❌ Gagal membuat server: " . $serverData["errors"][0]["detail"] . "\n";
    } else {
        $serverName = $serverData["attributes"]["name"];
        echo "✅ Server berhasil dibuat: $serverName\n";
        echo "🌐 Panel: $domain\n";
        echo "👤 Username: $username\n";
        echo "📧 Email: $email\n";
        echo "🔑 Password: $password\n";
    }
}
?>
  </pre>
</div>
<footer>© 2025 AngkasaDev | Panel Generator</footer>
</body>
</html>
