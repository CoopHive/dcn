brew services start postgresql 
brew services start zookeeper
brew services start kafka

psql -tc "SELECT 1 FROM pg_database WHERE datname = 'dvd_credits'" | grep -q 1 || createdb dvd_credits
bunx kysely migrate up