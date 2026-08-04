<?php
/**
 * Supabase Keep-Alive Ping
 * 
 * Faz uma requisição leve ao projeto Supabase para evitar
 * que ele seja pausado automaticamente pelo plano gratuito.
 * 
 * Configurar no Hostinger: hPanel > Avançado > Tarefas Agendadas (Cron Jobs)
 * Frequência recomendada: a cada 3 dias
 * Comando: wget -q -O /dev/null https://quiz.sistemaacademia.com.br/ping-supabase.php
 */

// Configuração do projeto Supabase
$supabaseUrl  = 'https://assajsfgzsupphruwjao.supabase.co';
$supabaseKey  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzc2Fqc2ZnenN1cHBocnV3amFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQzMjgyODcsImV4cCI6MjA5OTkwNDI4N30.epU10eCvaidpFZg79AtTvd6nnOARq6NHKXsquyCG70s';

// Endpoint leve: health check da API REST
$endpoint = $supabaseUrl . '/rest/v1/';

// Executa o ping via cURL
$ch = curl_init($endpoint);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT        => 10,
    CURLOPT_HTTPHEADER     => [
        'apikey: ' . $supabaseKey,
        'Authorization: Bearer ' . $supabaseKey,
    ],
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error    = curl_error($ch);
curl_close($ch);

// Log do resultado
$timestamp = date('Y-m-d H:i:s');
$status    = $error ? "ERRO: $error" : "HTTP $httpCode";
$logLine   = "[$timestamp] Supabase ping — $status\n";

// Grava log (opcional — comentar se não quiser arquivo de log)
$logFile = __DIR__ . '/ping-supabase.log';
file_put_contents($logFile, $logLine, FILE_APPEND | LOCK_EX);

// Resposta HTTP para o cron
header('Content-Type: text/plain; charset=utf-8');
http_response_code($error ? 500 : 200);
echo $logLine;
