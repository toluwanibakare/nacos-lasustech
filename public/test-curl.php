<?php
// test-curl.php - Diagnostic tool to check if cURL is working on cPanel
header("Content-Type: text/plain");

$apiUrl = "https://nacos-website-production.up.railway.app/api/nominees/olamzyweb";

echo "Testing cURL connection to Railway API...\n";
echo "API URL: " . $apiUrl . "\n\n";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $apiUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);

$response = curl_exec($ch);
$error = curl_error($ch);
$info = curl_getinfo($ch);
curl_close($ch);

if ($response === false) {
    echo "cURL failed!\n";
    echo "Error: " . $error . "\n";
    echo "HTTP Code: " . $info['http_code'] . "\n";
    echo "cURL Info: " . print_r($info, true) . "\n";
} else {
    echo "cURL succeeded!\n";
    echo "Response Code: " . $info['http_code'] . "\n";
    echo "Response Data:\n" . $response . "\n";
}
