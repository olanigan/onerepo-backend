package com.onecoder.gtd_backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.komamitsu.spring.data.sqlite.EnableSqliteRepositories;

@SpringBootApplication
@EnableSqliteRepositories
public class GtdBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(GtdBackendApplication.class, args);
	}

}
