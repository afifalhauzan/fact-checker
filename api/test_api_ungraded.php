<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;
use App\Http\Controllers\ProjekController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

echo "=== API ENDPOINT TEST ===\n";

// Get a teacher from DKV (jurusan_id = 3)
$teacher = User::where('role', 'guru')->where('jurusan_id', 3)->first();

if (!$teacher) {
    echo "No teacher found for jurusan_id 3\n";
    exit;
}

echo "Testing with teacher: {$teacher->name} (ID: {$teacher->id}, Jurusan: {$teacher->jurusan_id})\n\n";

// Simulate authentication
Auth::login($teacher);
echo "Authenticated as: " . Auth::user()->name . " (Role: " . Auth::user()->role . ")\n";

// Create a controller instance
$controller = new ProjekController();

// Create a mock request
$request = new Request();
$request->merge([
    'page' => 1,
    'limit' => 12
]);

// Call the ungraded method
try {
    echo "\nCalling ungraded() method...\n";
    $response = $controller->ungraded($request);
    
    // Get the response content
    $content = json_decode($response->getContent(), true);
    
    echo "Response Status: " . $response->getStatusCode() . "\n";
    echo "Response Data:\n";
    echo json_encode($content, JSON_PRETTY_PRINT) . "\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo "Trace: " . $e->getTraceAsString() . "\n";
}