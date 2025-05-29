// Inicializa o EmailJS com sua chave pública
emailjs.init("YOUR_PUBLIC_KEY"); // Substitua YOUR_PUBLIC_KEY pela sua chave pública do EmailJS

function enviarEmail(e) {
    e.preventDefault();

    // Mostra indicador de carregamento
    const btnEnviar = document.querySelector('.btn-submit');
    if (btnEnviar) {
        btnEnviar.innerHTML = 'Enviando...';
        btnEnviar.disabled = true;
    }

    // Coleta os dados do formulário
    const nome = document.getElementById('nome').value;
    const email = document.getElementById('email').value;
    const telefone = document.getElementById('telefone').value;
    const assunto = document.getElementById('assunto').value;
    const mensagem = document.getElementById('mensagem').value;

    // Prepara os parâmetros para o EmailJS
    const templateParams = {
        from_name: nome,
        from_email: email,
        telefone: telefone,
        assunto: assunto,
        message: mensagem,
        to_email: 'fcresiliencia@gmail.com'
    };

    // Envia o email usando EmailJS
    emailjs.send('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', templateParams)
        .then(function(response) {
            alert('Mensagem enviada com sucesso! Entraremos em contato em breve.');
            document.getElementById('contatoForm').reset();
        }, function(error) {
            alert('Erro ao enviar mensagem. Por favor, tente novamente.');
            console.error('Erro:', error);
        })
        .finally(function() {
            if (btnEnviar) {
                btnEnviar.innerHTML = 'Enviar Mensagem';
                btnEnviar.disabled = false;
            }
        });

    return false;
}

// Adiciona o evento de submit ao formulário
const contatoForm = document.getElementById('contatoForm');
if (contatoForm) {
    contatoForm.addEventListener('submit', enviarEmail);
} 