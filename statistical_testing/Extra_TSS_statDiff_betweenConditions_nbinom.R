library(dplyr)
library(tidyr)
library(car)
# Needed for model fitting
library(glmmTMB)
# needed for posthoc tests
library(emmeans)
library(poolr)


# set working directory
setwd("/Users/pacha/Documents/github_projects/test_tsspredatorGui/TSSpredator-GUI/statistical_testing")
read_coverage_table <- read.csv("TSS_Coverages_Ecoli.tsv", sep = "\t")


read_coverage_table_adapted <- read_coverage_table %>%
    mutate(TSS_ID = paste(SuperPos, SuperStrand, sep = "_")) %>%
    select(Condition, TSS_ID, replicate_ID, sum_coverage, list_as_string)
    

# get TSS_ID that occur less than 3 times
tss_id_counts <- read_coverage_table_adapted %>%
    group_by(TSS_ID) %>%
    summarise(count = n()) %>%
    filter(count < 3) %>%
    pull(TSS_ID)




get_likelihood_ratio <- function(d, use_HA = TRUE, drop_RE_if_single = TRUE) {
  d$Condition       <- droplevels(factor(d$Condition))
  d$replicate_ID <- droplevels(factor(d$replicate_ID))

  # Check that we did not forget to filter for TSS_ID with enough replicates
  if (dplyr::n_distinct(d$Condition) < 2 || nrow(d) < 2) {
    return(tibble(p = NA_real_))
  }

  # Get the number of reads in regions as successes of TSS
  d$k   <- round(as.numeric(d$sum_coverage))



  # create formula for models
  form_full <-  k ~ Condition + (1|replicate_ID)
  form_null <-  k ~ 1 + (1|replicate_ID)  


  # Fit models (beta-binomial, logit link)
  fit_full <- try(
    glmmTMB(form_full, data = d, family = nbinom2(link = "log")),
    silent = TRUE
  )
  fit_null <- try(
    glmmTMB(form_null, data = d, family = nbinom2(link = "log")),
    silent = TRUE
  )

  # If anything failed, return NA
  if (inherits(fit_full, "try-error") || inherits(fit_null, "try-error")) {
    return(tibble(p = NA_real_))
  }

  # Likelihood-ratio test (full vs null)
  lrt <- try(anova(fit_full, fit_null), silent = TRUE)
  if (inherits(lrt, "try-error")) {
    return(tibble(p = NA_real_))
  }

  tibble(p = as.numeric(tail(lrt$`Pr(>Chisq)`, 1)))
}



read_coverage_table_adapted_pvalue <- read_coverage_table_adapted %>%
  filter(!TSS_ID %in% tss_id_counts) %>%
  group_by(TSS_ID) %>%
  filter(round(as.numeric(sum_coverage)) > 1) %>%
  group_modify(~ get_likelihood_ratio(.x)) %>%  
  ungroup() %>%
  mutate(p_adj = p.adjust(p, method = "BH"))


sig_TSS <- read_coverage_table_adapted_pvalue %>%
  filter(p_adj < 0.05) %>%
  pull(TSS_ID)



pairwise_results <- read_coverage_table_adapted %>%
  filter(TSS_ID %in% sig_TSS) %>%
  group_by(TSS_ID) %>%
  group_modify(~ {
    fit_full <- glmmTMB(round(as.numeric(.x$sum_coverage)) ~ Condition + (1|replicate_ID),
                        data = .x, family = nbinom2(link="log"))
    emm <- emmeans(fit_full, ~ Condition)
    contrast_df <- as.data.frame(pairs(emm, adjust = "BH"))
    tibble(contrast_df)
  })

write.csv(read_coverage_table_adapted_pvalue, "results_binom_significantTSS_Ecoli.tsv", row.names = FALSE)
write.csv(pairwise_results, "results_binom_pairwise_results_Ecoli.tsv", row.names = FALSE)

