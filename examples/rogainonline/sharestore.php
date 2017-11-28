<?php
	header('Content-Type: application/json');
	define('UPLOAD_DIR', 'images/');
	$img = $_POST['img'];
	$img = str_replace('data:image/png;base64,', '', $img);
	$img = str_replace(' ', '+', $img);
    $data = base64_decode($img);
    $uniq = uniqid();
    if (!file_exists(UPLOAD_DIR)) {
        mkdir(UPLOAD_DIR, 0755, true);
    }
	$file = UPLOAD_DIR . $uniq . '.png';
	$success = file_put_contents($file, $data);
	echo $success ? "{\"result\": 1, \"file\": \"$uniq\"}" : "{\"result\": 0}";
?>