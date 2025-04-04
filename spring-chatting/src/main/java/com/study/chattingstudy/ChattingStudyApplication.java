package com.study.chattingstudy;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@EnableJpaAuditing
@SpringBootApplication
public class ChattingStudyApplication {

    public static void main(String[] args) {
        SpringApplication.run(ChattingStudyApplication.class, args);
    }

}
