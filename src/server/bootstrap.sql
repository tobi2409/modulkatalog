CREATE TABLE IF NOT EXISTS studiengaenge(
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS module(
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    semester INT,
    ects INT,
    professor_id INT REFERENCES professoren(id)
);

CREATE TABLE IF NOT EXISTS pruefungsarten(
    id SERIAL PRIMARY KEY,
    art VARCHAR(30) NOT NULL,
    minuten INT
);

CREATE TABLE IF NOT EXISTS professoren(
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS module_pruefungsarten(
    modul_id INT REFERENCES module(id),
    pruefungsart_id INT REFERENCES pruefungsarten(id),
    PRIMARY KEY (modul_id, pruefungsart_id)
);

CREATE TABLE IF NOT EXISTS studiengaenge_module(
    studiengang_id INT REFERENCES studiengaenge(id),
    modul_id INT REFERENCES module(id),
    PRIMARY KEY (studiengang_id, modul_id)
);