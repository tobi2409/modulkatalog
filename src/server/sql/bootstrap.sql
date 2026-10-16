CREATE TABLE IF NOT EXISTS studiengaenge(
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS professoren(
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255)
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

CREATE TABLE IF NOT EXISTS users(
    uuid UUID PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    isActive BOOLEAN NOT NULL DEFAULT TRUE
);

INSERT INTO studiengaenge (id, name, description) VALUES
    (1, 'Informatik', 'Grundlagen und Anwendungen der praktischen und theoretischen Informatik.'),
    (2, 'Wirtschaftsinformatik', 'Verbindung von Informatik, Betriebswirtschaft und digitalen Geschaeftsprozessen.'),
    (3, 'Medieninformatik', 'Konzeption und Entwicklung interaktiver und multimedialer Systeme.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO professoren (id, name, email) VALUES
    (1, 'Prof. Dr. Anna Berger', 'anna.berger@hszg.de'),
    (2, 'Prof. Dr. Markus Lehmann', 'markus.lehmann@hszg.de'),
    (3, 'Prof. Dr. Julia Richter', 'julia.richter@hszg.de')
ON CONFLICT (id) DO NOTHING;

INSERT INTO module (id, name, description, semester, ects, professor_id) VALUES
    (1, 'Programmierung I', 'Einfuehrung in Algorithmen, Datentypen und strukturierte Programmierung.', 1, 5, 1),
    (2, 'Datenbanken', 'Relationale Datenmodellierung, SQL und Datenbankentwurf.', 2, 5, 2),
    (3, 'Software Engineering', 'Methoden und Werkzeuge fuer die Entwicklung komplexer Softwaresysteme.', 3, 5, 1),
    (4, 'Betriebliche Informationssysteme', 'Informationssysteme zur Unterstuetzung betrieblicher Ablaeufe.', 3, 5, 3),
    (5, 'Webentwicklung', 'Entwicklung moderner, barrierearmer Webanwendungen.', 2, 5, 3),
    (6, 'Mensch-Computer-Interaktion', 'Gestaltung und Evaluation gebrauchstauglicher Benutzungsoberflaechen.', 4, 5, 2)
ON CONFLICT (id) DO NOTHING;

INSERT INTO pruefungsarten (id, art, minuten) VALUES
    (1, 'Klausur', 90),
    (2, 'Beleg', NULL),
    (3, 'Praesentation', 20),
    (4, 'Muendliche Pruefung', 30)
ON CONFLICT (id) DO NOTHING;

INSERT INTO studiengaenge_module (studiengang_id, modul_id) VALUES
    (1, 1), (1, 2), (1, 3), (1, 5),
    (2, 1), (2, 2), (2, 4),
    (3, 1), (3, 3), (3, 5), (3, 6)
ON CONFLICT (studiengang_id, modul_id) DO NOTHING;

INSERT INTO module_pruefungsarten (modul_id, pruefungsart_id) VALUES
    (1, 1),
    (2, 1),
    (3, 2), (3, 3),
    (4, 2),
    (5, 2),
    (6, 3), (6, 4)
ON CONFLICT (modul_id, pruefungsart_id) DO NOTHING;

SELECT setval(pg_get_serial_sequence('studiengaenge', 'id'), (SELECT MAX(id) FROM studiengaenge));
SELECT setval(pg_get_serial_sequence('professoren', 'id'), (SELECT MAX(id) FROM professoren));
SELECT setval(pg_get_serial_sequence('module', 'id'), (SELECT MAX(id) FROM module));
SELECT setval(pg_get_serial_sequence('pruefungsarten', 'id'), (SELECT MAX(id) FROM pruefungsarten));