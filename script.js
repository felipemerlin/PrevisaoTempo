
// ELEMENTOS HTML

const formulario = document.getElementById("formPesquisa");
const campoCidade = document.getElementById("cidade");
const botaoPesquisar = document.getElementById("botaoPesquisar");

const painelClima = document.getElementById("painelClima");
const mensagem = document.getElementById("mensagem");
const carregando = document.getElementById("carregando");

// INFORMAÇÕES DA CIDADE

const nomeCidade = document.getElementById("nomeCidade");
const regiaoCidade = document.getElementById("regiaoCidade");

// INFORMAÇÕES DO CLIMA

const temperatura = document.getElementById("temperatura");
const iconeClima = document.getElementById("iconeClima");
const descricaoClima = document.getElementById("descricaoClima");

const sensacao = document.getElementById("sensacao");
const umidade = document.getElementById("umidade");
const vento = document.getElementById("vento");
const condicaoDetalhe = document.getElementById("condicaoDetalhe");

const horarioAtualizacao = document.getElementById("horarioAtualizacao");

// CONTROLE DAS PESQUISAS

let numeroPesquisa = 0;


// FORMULÁRIO DE PESQUISA

formulario.addEventListener("submit", function(event) {

    event.preventDefault();

    const cidadeDigitada = campoCidade.value.trim();

    // VERIFICA SE O CAMPO ESTÁ VAZIO

    if (cidadeDigitada === "") {

        mostrarMensagem(
            "⚠️",
            "Campo vazio",
            "Digite o nome de uma cidade antes de pesquisar.",
            true
        );

        campoCidade.focus();

        return;
    }

    buscarClima(cidadeDigitada);

});


// MOSTRAR MENSAGENS NA TELA

function mostrarMensagem(icone, titulo, texto, erro = false) {

    mensagem.querySelector(".mensagem-icone").textContent = icone;
    mensagem.querySelector("h3").textContent = titulo;
    mensagem.querySelector("p").textContent = texto;

    mensagem.classList.remove("escondido");

    mensagem.classList.toggle("erro", erro);

    painelClima.classList.add("escondido");
    carregando.classList.add("escondido");

}


// MOSTRAR CARREGAMENTO

function mostrarCarregamento() {

    mensagem.classList.add("escondido");
    painelClima.classList.add("escondido");

    carregando.classList.remove("escondido");

    botaoPesquisar.disabled = true;
    botaoPesquisar.textContent = "Buscando...";

}


// FINALIZAR CARREGAMENTO

function finalizarCarregamento() {

    carregando.classList.add("escondido");

    botaoPesquisar.disabled = false;
    botaoPesquisar.textContent = "Pesquisar";

}


// BUSCAR UMA CIDADE E SEU CLIMA

async function buscarClima(cidade) {

    const pesquisaAtual = ++numeroPesquisa;

    mostrarCarregamento();

    try {

        // PRIMEIRA API: BUSCAR AS COORDENADAS DA CIDADE

        const enderecoGeocoding =
            "https://geocoding-api.open-meteo.com/v1/search?name=" +
            encodeURIComponent(cidade) +
            "&count=5&language=pt&format=json";

        const respostaCidade = await fetch(enderecoGeocoding);

        if (!respostaCidade.ok) {
            throw new Error("Não foi possível pesquisar a cidade.");
        }

        const dadosCidade = await respostaCidade.json();

        // VERIFICAR SE A CIDADE FOI ENCONTRADA

        if (!dadosCidade.results || dadosCidade.results.length === 0) {

            throw new Error("cidade_nao_encontrada");

        }

        // PEGAR O PRIMEIRO RESULTADO ENCONTRADO

        const cidadeEncontrada = dadosCidade.results[0];

        const latitude = cidadeEncontrada.latitude;
        const longitude = cidadeEncontrada.longitude;

        // SEGUNDA API: BUSCAR AS INFORMAÇÕES METEOROLÓGICAS

        const parametros = new URLSearchParams({

            latitude: latitude,
            longitude: longitude,

            current: [
                "temperature_2m",
                "relative_humidity_2m",
                "apparent_temperature",
                "is_day",
                "weather_code",
                "wind_speed_10m"
            ].join(","),

            temperature_unit: "celsius",
            wind_speed_unit: "kmh",
            timezone: "auto"

        });

        const enderecoClima =
            "https://api.open-meteo.com/v1/forecast?" +
            parametros.toString();

        const respostaClima = await fetch(enderecoClima);

        if (!respostaClima.ok) {
            throw new Error("Não foi possível consultar o clima.");
        }

        const dadosClima = await respostaClima.json();

        // VERIFICAR SE A API RETORNOU OS DADOS

        if (!dadosClima.current) {

            throw new Error("Os dados meteorológicos não estão disponíveis.");

        }

        // EVITAR QUE UMA PESQUISA ANTIGA SOBRESCREVA A NOVA

        if (pesquisaAtual !== numeroPesquisa) {
            return;
        }

        // ATUALIZAR O PAINEL

        atualizarPainel(cidadeEncontrada, dadosClima);

    }

    catch (erro) {

        // IGNORAR RESULTADOS DE PESQUISAS ANTIGAS

        if (pesquisaAtual !== numeroPesquisa) {
            return;
        }

        console.error("Erro na pesquisa:", erro);

        if (erro.message === "cidade_nao_encontrada") {

            mostrarMensagem(
                "🔎",
                "Cidade não encontrada",
                "Verifique o nome digitado e tente novamente.",
                true
            );

        } else {

            mostrarMensagem(
                "⚠️",
                "Não foi possível consultar o clima",
                "Verifique sua conexão com a internet e tente novamente.",
                true
            );

        }

    }

    finally {

        if (pesquisaAtual === numeroPesquisa) {
            finalizarCarregamento();
        }

    }

}


// TRADUZIR AS CONDIÇÕES METEOROLÓGICAS

function obterCondicao(codigo, dia) {

    switch (codigo) {

        case 0:
            return {
                descricao: "Céu limpo",
                icone: dia ? "☀️" : "🌙"
            };

        case 1:
            return {
                descricao: "Predominantemente limpo",
                icone: dia ? "🌤️" : "🌙"
            };

        case 2:
            return {
                descricao: "Parcialmente nublado",
                icone: "⛅"
            };

        case 3:
            return {
                descricao: "Nublado",
                icone: "☁️"
            };

        case 45:
        case 48:
            return {
                descricao: "Neblina",
                icone: "🌫️"
            };

        case 51:
        case 53:
        case 55:
            return {
                descricao: "Garoa",
                icone: "🌦️"
            };

        case 56:
        case 57:
            return {
                descricao: "Garoa congelante",
                icone: "🌧️"
            };

        case 61:
        case 63:
        case 65:
            return {
                descricao: "Chuva",
                icone: "🌧️"
            };

        case 66:
        case 67:
            return {
                descricao: "Chuva congelante",
                icone: "🌧️"
            };

        case 71:
        case 73:
        case 75:
        case 77:
            return {
                descricao: "Neve",
                icone: "❄️"
            };

        case 80:
        case 81:
        case 82:
            return {
                descricao: "Pancadas de chuva",
                icone: "🌧️"
            };

        case 85:
        case 86:
            return {
                descricao: "Pancadas de neve",
                icone: "🌨️"
            };

        case 95:
            return {
                descricao: "Tempestade",
                icone: "⛈️"
            };

        case 96:
        case 99:
            return {
                descricao: "Tempestade com granizo",
                icone: "⛈️"
            };

        default:
            return {
                descricao: "Condição desconhecida",
                icone: "🌡️"
            };

    }

}


// ATUALIZAR AS INFORMAÇÕES NA TELA

function atualizarPainel(cidade, dados) {

    const clima = dados.current;

    // NOME DA CIDADE

    nomeCidade.textContent = cidade.name;

    // REGIÃO E PAÍS

    const localizacao = [];

    if (cidade.admin1 && cidade.admin1 !== cidade.name) {
        localizacao.push(cidade.admin1);
    }

    if (cidade.country) {
        localizacao.push(cidade.country);
    }

    regiaoCidade.textContent = localizacao.join(", ");

    // TEMPERATURA

    temperatura.textContent = Math.round(clima.temperature_2m);

    // SENSAÇÃO TÉRMICA

    sensacao.textContent =
        Math.round(clima.apparent_temperature) + "°C";

    // UMIDADE DO AR

    umidade.textContent =
        clima.relative_humidity_2m + "%";

    // VELOCIDADE DO VENTO

    vento.textContent =
        clima.wind_speed_10m + " km/h";

    // CONDIÇÃO CLIMÁTICA

    const condicao = obterCondicao(
        clima.weather_code,
        clima.is_day === 1
    );

    descricaoClima.textContent = condicao.descricao;

    condicaoDetalhe.textContent = condicao.descricao;

    iconeClima.textContent = condicao.icone;

    // HORÁRIO DA ÚLTIMA ATUALIZAÇÃO DOS DADOS

    if (clima.time) {

        const horario = clima.time.split("T")[1];

        horarioAtualizacao.textContent = horario.slice(0, 5);

    } else {

        horarioAtualizacao.textContent = "--:--";

    }

    // EXIBIR O PAINEL

    mensagem.classList.add("escondido");
    carregando.classList.add("escondido");

    painelClima.classList.remove("escondido");

}
